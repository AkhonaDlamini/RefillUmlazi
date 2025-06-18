import Ionicons from '@expo/vector-icons/Ionicons';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, I18nManager, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { db } from '../../config/firebaseConfig';
I18nManager.forceRTL(false); // Force LTR

const reactionIcons = [
  { name: 'thumbs-up', color: '#4CAF50' },
  { name: 'heart', color: '#e91e63' },
  { name: 'checkmark-circle', color: '#2196F3' },
  { name: 'happy', color: '#FFC107' },
  { name: 'sad', color: '#9C27B0' },
];

const getDisplayName = (userId: string | undefined | null) => {
  if (!userId) return 'anonymous';
  return userId.includes('@') ? userId.split('@')[0] : userId;
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function AdminChats() {
  const [chats, setChats] = useState<any[]>([]);
  const [threadModalChatId, setThreadModalChatId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingToReplyId, setReplyingToReplyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reactionModalVisible, setReactionModalVisible] = useState<
    | { type: 'chat'; id: string }
    | { type: 'reply'; id: string; path: string[] }
    | null
  >(null);

  useEffect(() => {
    const chatsRef = ref(db, 'chats');
    return onValue(chatsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, value]) => ({
          id,
          ...(value as any),
        }));
        setChats(parsed.reverse());
      } else {
        setChats([]);
      }
    });
  }, []);

  // --- Reply logic similar to user side ---
  const sendReply = async (chatId: string) => {
    if (!replyText.trim()) return;
    setLoading(true);

    const replyPath = replyingToReplyId
      ? `chats/${chatId}/replies/${replyingToReplyId}/replies`
      : `chats/${chatId}/replies`;

    try {
      await push(ref(db, replyPath), {
        userId: 'admin',
        message: replyText,
        timestamp: new Date().toISOString(),
      });
      setReplyText('');
      setReplyingToReplyId(null);
    } catch {
      Alert.alert('Error', 'Failed to send reply.');
    } finally {
      setLoading(false);
    }
  };

  // --- Reaction logic ---
  const reactToMessage = async (
    chatId: string,
    reaction: string,
    type: 'chat' | 'reply',
    replyPathArr?: string[]
  ) => {
    const userId = 'admin';
    try {
      if (type === 'chat') {
        const chat = chats.find((c) => c.id === chatId);
        const currentReaction = chat?.reactions?.[userId];
        const reactionRef = ref(db, `chats/${chatId}/reactions`);
        if (currentReaction === reaction) {
          await update(reactionRef, { [userId]: null });
        } else {
          await update(reactionRef, { [userId]: reaction });
        }
      } else if (type === 'reply' && replyPathArr) {
        // Build the path to the nested reply's reactions
        let pathArr = ['chats', chatId, 'replies'];
        for (let i = 0; i < replyPathArr.length; i++) {
          pathArr.push(replyPathArr[i]);
          if (i < replyPathArr.length - 1) {
            pathArr.push('replies');
          }
        }
        pathArr.push('reactions');
        const reactionRef = ref(db, pathArr.join('/'));
        // Find the reply object for current reaction (optional, for UI)
        let reply = chats.find((c) => c.id === chatId)?.replies?.[replyPathArr[0]];
        for (let i = 1; i < replyPathArr.length; i++) {
          reply = reply?.replies?.[replyPathArr[i]];
        }
        const currentReaction = reply?.reactions?.[userId];
        if (currentReaction === reaction) {
          await update(reactionRef, { [userId]: null });
        } else {
          await update(reactionRef, { [userId]: reaction });
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to update reaction.');
    }
  };

  // --- Cross-platform delete chat ---
  const handleDeleteChat = (chatId: string) => {
    if (typeof window !== "undefined" && window.confirm) {
      const confirmed = window.confirm("Are you sure you want to delete this chat?");
      if (!confirmed) return;
      deleteChat(chatId);
      return;
    }
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteChat(chatId),
        },
      ]
    );
  };

  const deleteChat = async (chatId: string) => {
    try {
      await remove(ref(db, `chats/${chatId}`));
      console.log('Chat deleted:', chatId);
    } catch (error) {
      Alert.alert("Error", "Failed to delete chat.");
      console.error("Error deleting chat:", error);
    }
  };

  // --- Cross-platform delete reply ---
  const handleDeleteReply = (chatId: string, replyPathArr: string[]) => {
    Alert.alert(
      "Delete Reply",
      "Are you sure you want to delete this reply?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteReply(chatId, replyPathArr),
        },
      ]
    );
  };

  const deleteReply = async (chatId: string, replyPathArr: string[]) => {
    // Build the path: chats/{chatId}/replies/{replyId}/replies/{nestedReplyId}/replies/{deepNestedReplyId}...
    let pathArr = ['chats', chatId, 'replies'];
    for (let i = 0; i < replyPathArr.length; i++) {
      pathArr.push(replyPathArr[i]);
      if (i < replyPathArr.length - 1) {
        pathArr.push('replies');
      }
    }
    const path = pathArr.join('/');
    try {
      await remove(ref(db, path));
      console.log('Reply deleted:', path);
    } catch (error) {
      Alert.alert("Error", "Failed to delete reply.");
      console.error("Error deleting reply:", error);
    }
  };

  const getUserReaction = (reactions?: { [key: string]: string }) => {
    const userId = 'admin';
    return reactions?.[userId] || null;
  };

  const getReactionCount = (reactions?: { [key: string]: string }) =>
    reactions ? Object.values(reactions).filter(Boolean).length : 0;

  // --- Render reply (threaded) ---
  const renderReply = (
    replyId: string,
    reply: any,
    chatId: string,
    level: number = 0,
    parentPath: string[] = []
  ) => {
    const userReaction = getUserReaction(reply.reactions);

    const replyStyle =
      level === 0
        ? styles.replyCard
        : [styles.nestedReply, { marginLeft: level * 18 }];

    return (
      <View key={replyId} style={replyStyle}>
        <View style={styles.metaRow}>
          <Text style={styles.replyUser}>{getDisplayName(reply.userId)}</Text>
          <Text style={styles.replyTime}>{formatTime(reply.timestamp)}</Text>
        </View>
        <Text style={styles.replyMessage}>{reply.message}</Text>
        <View style={styles.replyActionRow}>
          <TouchableOpacity
            style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }]}
            onPress={() =>
              reactToMessage(chatId, getReactionIconName(userReaction), 'reply', [...parentPath, replyId])
            }
            onLongPress={() =>
              setReactionModalVisible({ type: 'reply', id: replyId, path: [...parentPath, replyId] })
            }
          >
            <Ionicons
              name={getReactionIconName(userReaction)}
              size={20}
              color={userReaction
                ? (reactionIcons.find(r => r.name === userReaction)?.color || '#4CAF50')
                : '#555'}
            />
            <Text style={styles.countText}>{getReactionCount(reply.reactions)}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reactionButton}
            onPress={() => {
              setReplyingToReplyId(replyId);
              setReplyText('');
            }}
          >
            <Ionicons name="arrow-undo" size={20} color="#555" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.reactionButton}
            onPress={() => handleDeleteReply(chatId, [...parentPath, replyId])}
          >
            <Ionicons name="trash-outline" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
        {/* Render nested replies recursively */}
        {reply.replies &&
          Object.entries(reply.replies).map(([nestedId, nestedReply]) =>
            renderReply(nestedId, nestedReply, chatId, level + 1, [...parentPath, replyId])
          )}
      </View>
    );
  };

  // --- Thread Modal ---

  const threadModalChat = chats.find((c) => c.id === threadModalChatId);

  const MemoizedThreadModalContent = React.useMemo(() => {
    if (!threadModalChat) return null;
    const userReaction = getUserReaction(threadModalChat.reactions);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.threadModalContainer}
      >
        <View style={styles.threadHeader}>
          <TouchableOpacity
            onPress={() => {
              setThreadModalChatId(null);
              setReplyingToReplyId(null);
            }}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1E90FF" />
          </TouchableOpacity>
          <Text style={styles.threadHeaderText}>Thread</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.threadModal}>
          <ScrollView style={{ flex: 1 }}>
            <View style={styles.reportCard}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{getDisplayName(threadModalChat.userId)}</Text>
                <Text style={styles.metaText}>{formatTime(threadModalChat.timestamp)}</Text>
              </View>
              <Text style={styles.reportMessage}>{threadModalChat.message}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }]}
                  onPress={() => setReactionModalVisible({ type: 'chat', id: threadModalChat.id })}
                >
                  <Ionicons name={(userReaction || 'thumbs-up') as React.ComponentProps<typeof Ionicons>['name']} size={20} color={userReaction ? '#4CAF50' : '#555'} />
                  <Text style={styles.countText}>{getReactionCount(threadModalChat.reactions)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.replyCountButton}
                  onPress={() => {}}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#555" />
                  <Text style={styles.countText}>{threadModalChat.replies ? Object.keys(threadModalChat.replies).length : 0}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={{ fontWeight: '600', marginBottom: 6 }}>Replies</Text>
              {threadModalChat.replies
                ? Object.entries(threadModalChat.replies).map(([replyId, reply]) =>
                    renderReply(replyId, reply, threadModalChat.id, 0, [])
                  )
                : <Text style={{ color: '#999', fontStyle: 'italic' }}>No replies yet.</Text>}
            </View>
          </ScrollView>

          <View style={styles.replyInputContainer}>
            {replyingToReplyId && (
              <View style={styles.replyingToIndicator}>
                <Text style={styles.replyingToText}>Replying to reply</Text>
                <TouchableOpacity onPress={() => setReplyingToReplyId(null)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            )}
            <TextInput
              style={styles.replyInput}
              placeholder={replyingToReplyId ? "Write your reply to this message..." : "Write your reply..."}
              placeholderTextColor="#999"
              multiline
              value={replyText}
              onChangeText={setReplyText}
            />
            {loading ? (
              <ActivityIndicator size="small" color="#1E90FF" style={{ marginLeft: 10 }} />
            ) : (
              <TouchableOpacity
                onPress={() => sendReply(threadModalChat.id)}
                style={styles.replySendButton}
              >
                <Text style={styles.replySendButtonText}>Send</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    );
  // eslint-disable-next-line
  }, [threadModalChat, replyText, replyingToReplyId, loading]);

  // --- Reaction Modal ---
  const ReactionModal = () => {
    if (!reactionModalVisible || !threadModalChatId) return null;
    const { type } = reactionModalVisible;
    const chatId = threadModalChatId;
    const path = type === 'reply' ? (reactionModalVisible as { type: 'reply'; id: string; path: string[] }).path : undefined;

    let currentReaction = null;
    let reply = null;
    const chat = chats.find((c) => c.id === chatId);

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
      <Modal
        transparent
        animationType="fade"
        visible={!!reactionModalVisible}
        onRequestClose={() => setReactionModalVisible(null)}
      >
        <TouchableOpacity
          style={styles.reactionModalOverlay}
          activeOpacity={1}
          onPress={() => setReactionModalVisible(null)}
        >
          <View style={styles.reactionModalContent}>
            <Text style={styles.reactionModalTitle}>Choose a reaction</Text>
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
                  <Ionicons name={name as React.ComponentProps<typeof Ionicons>['name']} size={32} color={color} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  function getReactionIconName(reaction: string | null | undefined) {
    // Map filled icon names to their outline fallback
    switch (reaction) {
      case 'thumbs-up':
        return 'thumbs-up';
      case 'heart':
        return 'heart';
      case 'checkmark-circle':
        return 'checkmark-circle';
      case 'happy':
        return 'happy';
      case 'sad':
        return 'sad';
      default:
        return 'thumbs-up-outline';
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Community Forum</Text>
      </View>

      {/* Spacer for space between header and first card */}
      <View style={{ height: 16 }} />


      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const userReaction = getUserReaction(item.reactions);
          const replyCount = item.replies ? Object.keys(item.replies).length : 0;

          return (
            <TouchableOpacity
              onPress={() => {
                setThreadModalChatId(item.id);
                setReplyText('');
                setReplyingToReplyId(null);
              }}
              style={styles.reportCard}
            >
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{getDisplayName(item.userId)}</Text>
                <Text style={styles.metaText}>{formatTime(item.timestamp)}</Text>
              </View>
              <Text style={styles.reportMessage}>{item.message}</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.reactionButton, userReaction && { backgroundColor: '#DCF8C6' }]}
                  onPress={() => {
                    // Toggle thumbs-up
                    if (userReaction === 'thumbs-up') {
                      reactToMessage(item.id, 'thumbs-up', 'chat');
                    } else {
                      reactToMessage(item.id, 'thumbs-up', 'chat');
                    }
                  }}
                  onLongPress={() => setReactionModalVisible({ type: 'chat', id: item.id })}
                >
                  <Ionicons
                    name={getReactionIconName(userReaction)}
                    size={20}
                    color={userReaction
                      ? (reactionIcons.find(r => r.name === userReaction)?.color || '#4CAF50')
                      : '#555'}
                  />
                  <Text style={styles.countText}>{getReactionCount(item.reactions)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.replyCountButton}
                  onPress={() => {
                    setThreadModalChatId(item.id);
                    setReplyText('');
                  }}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#555" />
                  <Text style={styles.countText}>{replyCount}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteChat(item.id)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyState}>No chats available.</Text>
        }
      />

      <Modal
        visible={!!threadModalChatId}
        animationType="slide"
        onRequestClose={() => setThreadModalChatId(null)}
      >
        {MemoizedThreadModalContent}
      </Modal>

      <ReactionModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E90FF',
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#1E90FF' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', margin: 10, color: '#1E90FF' },
  emptyState: { textAlign: 'center', marginTop: 40, fontSize: 16, color: '#888' },
  reportCard: {
    backgroundColor: '#F0F0F0',
    padding: 15,
    marginHorizontal: 10,
    marginBottom: 15,
    borderRadius: 10,
  },
  reportAuthor: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  reportTimestamp: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  cardText: { fontSize: 16, color: '#333', marginBottom: 10 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 15,
  },
  reactionSelected: {
    backgroundColor: '#E0F7FA',
    borderColor: '#4CAF50',
  },
  reactionCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#555',
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
    marginRight: 15,
  },
  replyCount: {
    marginLeft: 6,
    fontSize: 14,
    color: '#4CAF50',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  repliesContainer: {
    maxHeight: 150,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8 ,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    },
    replyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    },
    reply: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    },
    deleteIconSmall: {
    marginLeft: 10,
    padding: 4,
    },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    },
    reactionModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '90%',
    },
    modalReaction: {
    padding: 10,
    },
    selectedReaction: {
    backgroundColor: '#E0F7FA',
    borderRadius: 10,
    },
    replyModal: {
    backgroundColor: '#fff',
    padding: 20,
    width: '90%',
    },
    input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    color: '#000',
    },
    threadModalContainer: {
      flex: 1,
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    threadHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 15,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#ddd',
    },
    backButton: {
      padding: 10,
    },
    threadHeaderText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#1E90FF',
    },
    threadModal: {
      flex: 1,
      backgroundColor: '#fff',
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      padding: 15,
    },
    replyInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10,
      borderTopWidth: 1,
      borderTopColor: '#ddd',
      backgroundColor: '#fff',
    },
    replyingToIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#e1f5fe',
      padding: 8,
      borderRadius: 20,
      marginBottom: 10,
    },
    replyingToText: {
      fontSize: 14,
      color: '#01579b',
      marginRight: 5,
    },
    replyInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#ccc',
      borderRadius: 20,
      padding: 10,
      minHeight: 40,
      maxHeight: 100,
      marginRight: 10,
      color: '#000',
      textAlign: 'left', // Ensure left alignment
      textAlignVertical: 'top'
    },
    replySendButton: {
      backgroundColor: '#1E90FF',
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    replySendButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
    },
    reactionModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    reactionModalContent: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 20,
      width: '80%',
    },
    reactionModalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    reactionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    reactionIconButton: {
      padding: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 5,
    },
    countText: {
      marginLeft: 6,
      fontSize: 14,
      color: '#555',
    },
    replyCountButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#4CAF50',
      marginRight: 15,
    },
    metaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    metaText: {
      fontSize: 14,
      color: '#666',
    },
    reportMessage: {
      fontSize: 16,
      color: '#333',
      marginBottom: 10,
    },
    replyCard: {
      backgroundColor: '#f9f9f9',
      padding: 10,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#ddd',
    },
    nestedReply: {
      borderLeftWidth: 2,
      borderLeftColor: '#1E90FF',
      paddingLeft: 12,
      marginBottom: 10,
      backgroundColor: 'transparent',
    },
    replyUser: {
      fontWeight: 'bold',
      color: '#333',
    },
    replyTime: {
      fontSize: 12,
      color: '#666',
    },
    replyMessage: {
      fontSize: 14,
      color: '#333',
      marginBottom: 8,
    },
    replyActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 10,
      padding: 4,
    },
    });

