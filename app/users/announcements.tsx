import { useAnnouncements } from "../../context/AnnouncementsContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getAuth } from "firebase/auth";

export default function AnnouncementsScreen() {
  const { announcements, readIds, markAsRead } = useAnnouncements();
  const [currentTime, setCurrentTime] = useState(new Date());
  const router = useRouter();
  const auth = getAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert("Authentication Required", "Please log in to view announcements.");
      router.replace("/auth/login");
    }
  }, [auth.currentUser, router]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "";
    const then = new Date(timestamp);
    const diffMs = currentTime.getTime() - then.getTime();
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const timeOnly = then.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    // If older than 24 hours, show only the date (e.g., "10 June 2025")
    if (diffMs > 24 * 60 * 60 * 1000) {
      return then.toLocaleDateString([], {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    // For less than 24 hours, show relative time and time of day
    if (days > 0) return `${days}d ago • ${then.toLocaleDateString()} ${timeOnly}`;
    if (hours > 0) return `${hours}h ago • ${timeOnly}`;
    if (minutes > 0) return `${minutes}m ago • ${timeOnly}`;
    return `Just now • ${timeOnly}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Announcements</Text>
      </View>
      {auth.currentUser ? (
        <FlatList
          data={announcements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isRead = readIds.includes(item.id);
            return (
              <TouchableOpacity
                onPress={() => markAsRead(item.id)}
                activeOpacity={0.8}
                style={[styles.card, !isRead && styles.unreadCard]}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {!isRead && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newBadgeText}>NEW</Text>
                    </View>
                  )}
                  <Text style={[styles.cardText, { flexShrink: 1, marginLeft: isRead ? 0 : 8 }]}>
                    📣 {item.text}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
              No announcements yet.
            </Text>
          }
        />
      ) : (
        <Text style={{ textAlign: "center", marginTop: 20, color: "#888" }}>
          Loading...
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E90FF",
  },
  appName: { fontSize: 24, fontWeight: "bold", color: "#1E90FF" },
  card: {
    backgroundColor: "#F9F9F9",
    padding: 15,
    margin: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  unreadCard: {
    borderWidth: 1,
    borderColor: "#1E90FF",
  },
  cardText: { fontSize: 16, color: "#333" },
  timestamp: {
    marginTop: 6,
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  newBadge: {
    backgroundColor: "#1E90FF",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
    alignSelf: "flex-start",
  },
  newBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});