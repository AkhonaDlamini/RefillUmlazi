import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { ref, onValue, push, update, remove } from 'firebase/database';
import { db } from '../../config/firebaseConfig';

type Announcement = {
  id: string;
  text: string;
  timestamp?: string;
};

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementInput, setAnnouncementInput] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  // Listen to announcements in Firebase
  useEffect(() => {
    try {
      const announcementsRef = ref(db, 'announcements');
      const unsubscribe = onValue(announcementsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const parsed = Object.entries(data).map(([id, value]) => ({
            id,
            ...(value as Omit<Announcement, 'id'>),
          }));
          setAnnouncements(parsed.reverse());
        } else {
          setAnnouncements([]);
        }
      }, (err) => {
        console.error(err);
        setError("Could not load announcements. Please try again later.");
        Alert.alert("Error", "Could not load announcements. Please try again later.");
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
      setError("Could not load announcements. Please try again later.");
      Alert.alert("Error", "Could not load announcements. Please try again later.");
    }
  }, []);

  // Update current time every second for live timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format timestamp with live "time ago" plus exact date/time
  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return '';
    const then = new Date(timestamp);
    const diffMs = currentTime.getTime() - then.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago • ${then.toLocaleString()}`;
    if (hours > 0) return `${hours}h ago • ${then.toLocaleTimeString()}`;
    if (minutes > 0) return `${minutes}m ago • ${then.toLocaleTimeString()}`;
    return `Just now • ${then.toLocaleTimeString()}`;
  };

  // Handle posting or updating announcement
  const handleAnnouncementSubmit = async () => {
    const text = announcementInput.trim();
    if (!text) return;

    try {
      if (editId) {
        await update(ref(db, `announcements/${editId}`), {
          text,
          timestamp: new Date().toISOString(),
        });
        setEditId(null);
      } else {
        await push(ref(db, 'announcements'), {
          text,
          timestamp: new Date().toISOString(),
        });
      }
      setAnnouncementInput('');
    } catch (e) {
      console.error(e);
      setError("Could not save announcement. Please try again.");
      Alert.alert("Error", "Could not save announcement. Please try again.");
    }
  };

  // Start editing an announcement
  const handleEdit = (item: Announcement) => {
    setAnnouncementInput(item.text);
    setEditId(item.id);
  };

  // Confirm and delete an announcement
  const handleDelete = async (id: string) => {
    // Web: use window.confirm
    if (typeof window !== "undefined" && window.confirm) {
      const confirmed = window.confirm("Are you sure you want to delete this announcement?");
      if (!confirmed) return;
      try {
        await remove(ref(db, `announcements/${id}`));
      } catch (error) {
        alert("Failed to delete announcement.");
        setError("Failed to delete announcement.");
        console.error("Error deleting announcement:", error);
      }
      return;
    }

    // Native: use Alert.alert
    Alert.alert(
      "Delete Announcement",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await remove(ref(db, `announcements/${id}`));
            } catch (error) {
              Alert.alert("Error", "Failed to delete announcement.");
              setError("Failed to delete announcement.");
              console.error("Error deleting announcement:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Announcements</Text>
      </View>

      {error && (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="Write an announcement..."
        value={announcementInput}
        onChangeText={setAnnouncementInput}
      />

      <Button
        title={editId ? 'Update Announcement' : 'Post Announcement'}
        onPress={handleAnnouncementSubmit}
        color="#1E90FF"
      />

      <FlatList
        data={announcements}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardText}>📣 {item.text}</Text>
            <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
            <View style={styles.row}>
              <Button title="Edit" onPress={() => handleEdit(item)} />
              <Button title="Delete" color="red" onPress={() => handleDelete(item.id)} />
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: 'center', marginTop: 20, color: '#888' }}>
            No announcements yet.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', padding: 16 },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E90FF',
  },
  appName: { fontSize: 24, fontWeight: 'bold', color: '#1E90FF' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#F9F9F9',
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#F9F9F9',
    padding: 15,
    marginVertical: 6,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  cardText: { fontSize: 16, color: '#333' },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
