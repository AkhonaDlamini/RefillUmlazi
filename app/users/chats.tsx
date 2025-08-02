import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { auth, db } from '../../config/firebaseConfig';
import { ThemeContext } from '../../context/ThemeContext';

type Chat = {
  id: string;
  userId: string;
  displayName?: string;
  message: string;
  timestamp: string;
  reactions?: { [userId: string]: string };
  replies?: { [key: string]: Reply };
};

type Reply = {
  userId: string;
  displayName?: string;
  message: string;
  timestamp: string;
  reactions?: { [userId: string]: string };
  replies?: { [key: string]: Reply };
};

const reactionIcons = [
  { name: 'thumbs-up', color: '#1E90FF' },
  { name: 'heart', color: '#FF4444' },
  { name: 'happy-outline', color: '#FFD700' },
  { name: 'star', color: '#FFD700' },
  { name: 'sad-outline', color: '#6699CC' },
  { name: 'skull-outline', color: '#FF6347' },
];

export default function UserChat() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [threadModalChatId, setThreadModalChatId] = useState<string | null>(null);
  const [reactionModalVisible, setReactionModalVisible] = useState<
    | { type: 'chat'; id: string; chatId: string }
    | { type: 'reply'; id: string; chatId: string; path: string[] }
    | null
  >(null);
  const [users, setUsers] = useState<{ [uid: string]: { displayName?: string; email?: string } }>({});
  const { width } = useWindowDimensions();
  const { isDark } = useContext(ThemeContext);

  useEffect(() => {
    if (!threadModalChatId) return;
    const onBackPress = () => {
      setThreadModalChatId(null);
      setReplyingToReplyId(null);
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [threadModalChatId]);

  useEffect(() => {
    const chatRef = ref(db, 'chats');
    return onValue(chatRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({ id, ...(value as Omit<Chat, 'id'>) }));
      setChats(parsed.reverse());
    });
  }, []);

  useEffect(() => {
    const usersRef = ref(db, 'users');
    return onValue(usersRef, (snapshot) => {
      setUsers(snapshot.val() || {});
    });
  }, []);

  const sendMessage = async () => {
    if (!message.trim() || !auth.currentUser) return;
    await push(ref(db, 'chats'), {
      userId: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || 'anonymous',
      message,
      timestamp: new Date().toISOString(),
    });
    setMessage('');
  };

  const sendReply = React.useCallback(
    async (chatId: string) => {
      if (!replyText.trim() || !auth.currentUser) return;
      setLoading(true);
      const path = replyingToReplyId
        ? `chats/${chatId}/replies/${replyingToReplyId}/replies`
        : `chats/${chatId}/replies`;
      await push(ref(db, path), {
        userId: auth.currentUser.uid,
        displayName: auth.currentUser.displayName || 'anonymous',
        message: replyText,
        timestamp: new Date().toISOString(),
      });
      setReplyText('');
      setReplyingToReplyId(null);
      setLoading(false);
    },
    [replyText, replyingToReplyId]
  );

  const reactToMessage = async (
    chatId: string,
    reaction: string,
    type: 'chat' | 'reply',
    replyPathArr?: string[]
  ) => {
    const userId = getSafeUserId(auth.currentUser?.uid || 'anonymous');
    try {
      if (type === 'chat') {
        const chat = chats.find(c => c.id === chatId);
        const current = chat?.reactions?.[userId];
        const pathRef = ref(db, `chats/${chatId}/reactions/${userId}`);
        if (current === reaction) {
          await remove(pathRef);
        } else {
          await update(ref(db, `chats/${chatId}/reactions`), { [userId]: reaction });
        }
      } else if (type === 'reply' && replyPathArr) {
        let pathArr = ['chats', chatId, 'replies'];
        for (let i = 0; i < replyPathArr.length; i++) {
          pathArr.push(replyPathArr[i]);
          if (i < replyPathArr.length - 1) {
            pathArr.push('replies');
          }
        }
        pathArr.push('reactions');
        const reactionRef = ref(db, pathArr.join('/'));
        let reply = chats.find((c) => c.id === chatId)?.replies?.[replyPathArr[0]];
        for (let i = 1; i < replyPathArr.length; i++) {
          reply = reply?.replies?.[replyPathArr[i]];
        }
        const current = reply?.reactions?.[userId];
        if (current === reaction) {
          await update(reactionRef, { [userId]: null });
        } else {
          await update(reactionRef, { [userId]: reaction });
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const getUserReaction = React.useCallback((reactions?: { [key: string]: string }) => {
    const userId = getSafeUserId(auth.currentUser?.uid || 'anonymous');
    return reactions?.[userId] || null;
  }, []);

  const getReactionCount = React.useCallback(
    (reactions?: { [key: string]: string }) =>
      reactions ? Object.values(reactions).filter(Boolean).length : 0,
    []
  );

  const getDisplayName = React.useCallback(
    (userId?: string | null, displayName?: string) => {
      if (displayName) return displayName;
      if (!userId) return 'anonymous';
      if (users[userId]?.displayName) return users[userId].displayName;
      return userId;
    },
    [users]
  );

  const renderReply = React.useCallback(
    (
      replyId: string,
      reply: Reply & { replies?: { [key: string]: Reply } },
      chatId: string,
      level: number = 0,
      parentPath: string[] = []
    ) => {
      const userReaction = getUserReaction(reply.reactions);
      const reactionIcon = reactionIcons.find(r => r.name === userReaction) || reactionIcons[0];

      function formatTime(timestamp: string): React.ReactNode {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

        const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString(undefined, options);
      }

      return (
        <View
          key={replyId}
          style={[
            styles.replyCard,
            { marginLeft: level * 20 }
          ]}
        >
          <View style={styles.metaRow}>
            <Text style={styles.replyUser}>{getDisplayName(reply.userId, reply.displayName)}</Text>
            <Text style={styles.replyTime}>{formatTime(reply.timestamp)}</Text>
          </View>
          <Text style={styles.replyMessage}>{reply.message}</Text>
          <View style={styles.replyActionRow}>
            <TouchableOpacity
              style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }]}
              onPress={() =>
                setReactionModalVisible({
                  type: 'reply',
                  id: replyId,
                  chatId,
                  path: [...parentPath, replyId],
                })
              }
            >
              <Ionicons
                name={userReaction || 'thumbs-up-outline'}
                size={20}
                color={userReaction ? reactionIcon.color : '#555'}
              />
              <Text style={styles.countText}>{getReactionCount(reply.reactions)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.replyActionButton}
              onPress={() => {
                setReplyingToReplyId(replyId);
                setReplyText('');
              }}
            >
              <Ionicons name="arrow-undo" size={20} color="#555" />
            </TouchableOpacity>
          </View>
          {reply.replies &&
            Object.entries(reply.replies).map(([nestedId, nestedReply]) =>
              renderReply(nestedId, nestedReply, chatId, level + 1, [...parentPath, replyId])
            )}
        </View>
      );
    },
    [getUserReaction, getReactionCount, getDisplayName, setReactionModalVisible, setReplyingToReplyId, setReplyText]
  );

  const threadChat = chats.find(c => c.id === threadModalChatId);
  const MemoThreadModal = React.useMemo(() => {
    if (!threadChat) return null;
    const userReaction = getUserReaction(threadChat.reactions);

    function formatTime(timestamp: string): React.ReactNode {
      if (!timestamp) return '';
      const date = new Date(timestamp);
      const now = new Date();
      const diff = (now.getTime() - date.getTime()) / 1000;

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

      const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    }

    const threadUserReaction = getUserReaction(threadChat.reactions);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 50} // Reduced offset
        style={[styles.threadModalContainer, { width, backgroundColor: isDark ? '#181818' : '#fff' }]}
      >
        <View style={[styles.threadHeader, { backgroundColor: isDark ? '#23272b' : '#fff', borderBottomColor: isDark ? '#444' : '#eee' }]}>
          <TouchableOpacity onPress={() => { setThreadModalChatId(null); setReplyingToReplyId(null); }} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E90FF" />
          </TouchableOpacity>
          <Text style={[styles.threadHeaderText, { color: isDark ? "#1E90FF" : "#1E90FF" }]}>Thread</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.threadModal}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 80 }} // Reduced padding
          >
            <View style={[styles.reportCard, { backgroundColor: isDark ? '#23272b' : '#F0F0F0' }]}>
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: isDark ? "#aaa" : "#666" }]}>{getDisplayName(threadChat.userId, threadChat.displayName)}</Text>
                <Text style={[styles.metaText, { color: isDark ? "#aaa" : "#666" }]}>{formatTime(threadChat.timestamp)}</Text>
              </View>
              <Text style={[styles.reportMessage, { color: isDark ? "#fff" : "#333" }]}>{threadChat.message}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }, { borderColor: isDark ? "#444" : "#ccc" }]}
                  onPress={() => setReactionModalVisible({ type: 'chat', id: threadChat.id, chatId: threadChat.id })}
                >
                  <Ionicons
                    name={threadUserReaction || 'thumbs-up-outline'}
                    size={20}
                    color={threadUserReaction ? '#4CAF50' : (isDark ? "#aaa" : "#555")}
                  />
                  <Text style={[styles.countText, { color: isDark ? "#aaa" : "#555" }]}>{getReactionCount(threadChat.reactions)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.replyCountButton, { borderColor: isDark ? "#444" : "#ccc" }]}
                  onPress={() => {}}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={isDark ? "#aaa" : "#555"} />
                  <Text style={[styles.countText, { color: isDark ? "#aaa" : "#555" }]}>{threadChat.replies ? Object.keys(threadChat.replies).length : 0}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: '600', marginBottom: 6, color: isDark ? "#fff" : "#222" }}>Replies</Text>
              {threadChat.replies
                ? Object.entries(threadChat.replies).map(([rid, r]) =>
                    renderReply(rid, r, threadChat.id, 0)
                  )
                : <Text style={{ color: isDark ? "#aaa" : "#999", fontStyle: 'italic' }}>No replies yet.</Text>}
            </View>
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 50} // Reduced offset
            style={{ width: '100%' }}
          >
            <View style={[styles.replyInputContainer, { backgroundColor: isDark ? '#23272b' : '#fff', borderTopColor: isDark ? '#444' : '#ccc' }]}>
              {replyingToReplyId && (
                <View style={[styles.replyingToIndicator, { backgroundColor: isDark ? '#23272b' : '#f0f0f0' }]}>
                  <Text style={[styles.replyingToText, { color: isDark ? "#fff" : "#666" }]}>Replying to reply</Text>
                  <TouchableOpacity onPress={() => setReplyingToReplyId(null)}>
                    <Ionicons name="close" size={16} color={isDark ? "#fff" : "#666"} />
                  </TouchableOpacity>
                </View>
              )}
              <TextInput
                style={[styles.replyInput, { color: isDark ? "#fff" : "#000", borderColor: isDark ? "#444" : "#ccc", backgroundColor: isDark ? '#181818' : '#fff' }]}
                placeholder={replyingToReplyId ? "Write your reply to this message..." : "Write your reply..."}
                placeholderTextColor={isDark ? "#aaa" : "#999"}
                multiline
                value={replyText}
                onChangeText={setReplyText}
              />
              {loading
                ? <ActivityIndicator size="small" color="#1E90FF" style={{ marginLeft: 10 }} />
                : <TouchableOpacity onPress={() => sendReply(threadChat.id)} style={styles.replySendButton}>
                    <Text style={styles.replySendButtonText}>Send</Text>
                  </TouchableOpacity>
              }
            </View>
          </KeyboardAvoidingView>
        </View>
      </KeyboardAvoidingView>
    );
  }, [threadChat, getUserReaction, width, isDark, getDisplayName, getReactionCount, replyingToReplyId, replyText, loading, renderReply, sendReply]);

  const ReactionModal = () => {
    if (!reactionModalVisible) return null;
    const { type, chatId } = reactionModalVisible;
    const chat = chats.find(c => c.id === chatId);

    let currentReaction = null;
    let reply = null;
    let path: string[] | undefined = undefined;

    if (type === 'reply') {
      path = (reactionModalVisible as { type: 'reply'; id: string; chatId: string; path: string[] }).path;
    }

    if (type === 'chat') {
      currentReaction = getUserReaction(chat?.reactions);
    } else if (type === 'reply' && path) {
      reply = chat?.replies?.[path[0]];
      for (let i = 1; i < path.length; i++) {
        reply = reply?.replies?.[path[i]];
      }
      currentReaction = getUserReaction(reply?.reactions);
    }

    return (
      <Modal transparent animationType="fade" visible={!!reactionModalVisible} onRequestClose={() => setReactionModalVisible(null)}>
        <TouchableOpacity style={styles.reactionModalOverlay} activeOpacity={1} onPress={() => setReactionModalVisible(null)}>
          <View style={[styles.reactionModalContent, { backgroundColor: isDark ? '#23272b' : '#fff' }]}>
            <Text style={[styles.reactionModalTitle, { color: isDark ? "#fff" : "#222" }]}>Choose a reaction</Text>
            <View style={styles.reactionsRow}>
              {reactionIcons.map(({ name, color }) => (
                <TouchableOpacity
                  key={name}
                  onPress={() => {
                    reactToMessage(chatId, name, type, type === 'reply' ? path : undefined);
                    setReactionModalVisible(null);
                  }}
                  style={[styles.reactionIconButton, currentReaction === name && { backgroundColor: color + '33' }]}
                >
                  <Ionicons name={name} size={32} color={color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 50} // Reduced offset
      style={[styles.container, { backgroundColor: isDark ? '#181818' : '#FFFFFF' }]}
    >
      <View style={[styles.headerContainer, { backgroundColor: isDark ? '#181818' : '#FFFFFF' }]}>
        <Text style={[styles.header, { color: isDark ? "#1E90FF" : "#1E90FF", backgroundColor: isDark ? "#181818" : "#fff", borderBottomColor: "#1E90FF" }]}>Community Chat</Text>
      </View>
      <FlatList
        data={chats}
        keyExtractor={item => item.id}
        inverted
        contentContainerStyle={{ paddingBottom: 80 }} // Reduced padding
        renderItem={({ item }) => {
          const userReaction = getUserReaction(item.reactions);
          const replyCount = item.replies ? Object.keys(item.replies).length : 0;
          const reactionIcon = reactionIcons.find(r => r.name === userReaction) || reactionIcons[0];

          function formatTime(timestamp: string): React.ReactNode {
            if (!timestamp) return '';
            const date = new Date(timestamp);
            const now = new Date();
            const diff = (now.getTime() - date.getTime()) / 1000;

            if (diff < 60) return 'Just now';
            if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
            if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;

            const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
            return date.toLocaleDateString(undefined, options);
          }

          return (
            <TouchableOpacity
              style={[styles.reportCard, { backgroundColor: isDark ? "#23272b" : "#F0F0F0" }]}
              onPress={() => {
                setThreadModalChatId(item.id);
                setReplyText('');
                setReplyingToReplyId(null);
              }}
            >
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: isDark ? "#aaa" : "#666" }]}>{getDisplayName(item.userId, item.displayName)}</Text>
                <Text style={[styles.metaText, { color: isDark ? "#aaa" : "#666" }]}>{formatTime(item.timestamp)}</Text>
              </View>
              <Text style={[styles.reportMessage, { color: isDark ? "#fff" : "#333" }]}>{item.message}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }, { borderColor: isDark ? "#444" : "#ccc" }]}
                  onPress={() => setReactionModalVisible({ type: 'chat', id: item.id, chatId: item.id })}
                  onLongPress={() => setReactionModalVisible({ type: 'chat', id: item.id, chatId: item.id })}
                >
                  <Ionicons
                    name={userReaction || 'thumbs-up-outline'}
                    size={20}
                    color={userReaction ? reactionIcon.color : (isDark ? "#aaa" : "#555")}
                  />
                  <Text style={[styles.countText, { color: isDark ? "#aaa" : "#555" }]}>{getReactionCount(item.reactions)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.replyCountButton, { borderColor: isDark ? "#444" : "#ccc" }]}
                  onPress={() => {
                    setThreadModalChatId(item.id);
                    setReplyText('');
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color={isDark ? "#aaa" : "#555"} />
                  <Text style={[styles.countText, { color: isDark ? "#aaa" : "#555" }]}>{replyCount}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ marginTop: 20 }}>
            <Text style={{ color: isDark ? "#aaa" : "#777", fontStyle: 'italic' }}>No messages yet.</Text>
          </View>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 50} // Reduced offset
        style={{ width: '100%' }}
      >
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: isDark ? "#1A1A1A" : "#fff",
              borderTopColor: isDark ? "#333" : "#ccc",
              flexShrink: 1,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#000",
                backgroundColor: isDark ? "#2A2A2A" : "#fff",
                borderColor: isDark ? "#444" : "#ccc",
              },
            ]}
            placeholder="Type your message..."
            placeholderTextColor={isDark ? "#999" : "#999"}
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Ionicons name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={!!threadModalChatId}
        animationType="slide"
        onRequestClose={() => {
          setThreadModalChatId(null);
          setReplyingToReplyId(null);
        }}
        presentationStyle="pageSheet"
      >
        {MemoThreadModal}
      </Modal>

      <ReactionModal />
    </KeyboardAvoidingView>
  );
}

function getSafeUserId(userId: string): string {
  return userId.replace(/[.#$\[\]]/g, '_');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  headerContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1E90FF',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
    flex: 1,
    textAlign: 'center',
    marginTop: 15,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  reportCard: { backgroundColor: '#F0F0F0', padding: 15, marginHorizontal: 10, marginBottom: 15, borderRadius: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  metaText: { fontSize: 13, color: '#666' },
  reportMessage: { fontSize: 16, color: '#333', marginBottom: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  reactionButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  replyCountButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ccc', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginLeft: 8 },
  countText: { marginLeft: 6, fontSize: 14, color: '#555' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 1, borderTopWidth: 1, borderTopColor: '#ccc', backgroundColor: '#fff', flexShrink: 1 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, color: '#000', maxHeight: 100 },
  sendButton: { backgroundColor: '#1E90FF', padding: 10, borderRadius: 20, marginLeft: 8 },
  threadModalContainer: { flex: 1, backgroundColor: '#fff' },
  threadHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
  backButton: { padding: 4 },
  threadHeaderText: { fontSize: 18, fontWeight: 'bold', color: '#1E90FF' },
  threadModal: { flex: 1, padding: 16 },
  replyInputContainer: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#ccc', backgroundColor: '#fff', flexShrink: 1 },
  replyInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 1, fontSize: 16, color: '#000', maxHeight: 100 },
  replySendButton: { backgroundColor: '#1E90FF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, marginLeft: 8, justifyContent: 'center', alignItems: 'center' },
  replySendButtonText: { color: '#fff', fontWeight: 'bold' },
  replyCard: { backgroundColor: '#E6F2FF', borderRadius: 10, padding: 10, marginBottom: 10 },
  replyUser: { fontWeight: 'bold', color: '#333' },
  replyTime: { fontSize: 12, color: '#666' },
  replyMessage: { fontSize: 15, marginVertical: 4, color: '#333' },
  replyActionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  replyActionButton: { marginLeft: 8, padding: 4 },
  replyingToIndicator: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f0f0f0', padding: 8, borderRadius: 8, marginBottom: 8 },
  replyingToText: { fontSize: 12, color: '#666' },
  reactionModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  reactionModalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' },
  reactionModalTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  reactionsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  reactionIconButton: { padding: 10, borderRadius: 10 },
});
