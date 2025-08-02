import { useAnnouncements } from "../../context/AnnouncementsContext";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getAuth } from "firebase/auth";
import { ThemeContext } from "../../context/ThemeContext";

export default function AnnouncementsScreen() {
  const { announcements, readIds, markAsRead } = useAnnouncements();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userCreationTime, setUserCreationTime] = useState<Date | null>(null);
  const router = useRouter();
  const auth = getAuth();
  const { isDark } = React.useContext(ThemeContext);

  useEffect(() => {
    if (!auth.currentUser) {
      Alert.alert("Authentication Required", "Please log in to view announcements.");
      router.replace("/auth/login");
    } else {
      const creationTime = auth.currentUser.metadata.creationTime;
      if (creationTime) {
        setUserCreationTime(new Date(creationTime));
      }
    }
  }, [auth.currentUser, router]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredAnnouncements = announcements.filter((item) => {
    if (!userCreationTime || !item.timestamp) return true;
    const announcementTime = new Date(item.timestamp);
    return announcementTime >= userCreationTime;
  });

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

    if (diffMs > 24 * 60 * 60 * 1000) {
      return then.toLocaleDateString([], {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }

    if (days > 0) return `${days}d ago • ${then.toLocaleDateString()} ${timeOnly}`;
    if (hours > 0) return `${hours}h ago • ${timeOnly}`;
    if (minutes > 0) return `${minutes}m ago • ${timeOnly}`;
    return `Just now • ${timeOnly}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#121212" : "#FFFFFF",
    },
    headerContainer: {
      marginTop: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 15,
      borderBottomWidth: 1,
      borderBottomColor: "#1E90FF",
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1E90FF",
      flex: 1,
      textAlign: "center",
      marginTop: 15,
    },
    helpButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      padding: 4,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#1E90FF",
      textAlign: "center",
      flex: 1,
      marginTop: 15,
    },
    helpButtonText: {
      fontSize: 14,
      color: "#1E90FF",
      fontWeight: "500",
    },
    card: {
  backgroundColor: isDark ? "#1E1E1E" : "#F9F9F9",
  marginTop: 15,
  marginVertical: 8, // only vertical margin
  borderRadius: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.15,
  shadowRadius: 6,
  elevation: 4,
  padding: 12,
},
    listContainer: {
  paddingHorizontal: 16,
  paddingBottom: 16,
},
    unreadCard: {
      borderWidth: 1,
      borderColor: "#1E90FF",
    },
    cardText: {
      fontSize: 16,
      color: isDark ? "#FFF" : "#333",
      fontWeight: "500",
      lineHeight: 22,
    },
    timestamp: {
      marginTop: 8,
      fontSize: 12,
      color: isDark ? "#AAA" : "#888",
      fontStyle: "italic",
      fontWeight: "400",
    },
    newBadge: {
      backgroundColor: "#1E90FF",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 4,
      alignSelf: "flex-start",
    },
    newBadgeText: {
      color: "#FFFFFF",
      fontSize: 10,
      fontWeight: "600",
      letterSpacing: 0.5,
    },
    emptyText: {
      textAlign: "center",
      marginTop: 40,
      fontSize: 16,
      color: isDark ? "#CCC" : "#888",
      fontWeight: "400",
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Announcements</Text>
      </View>
      {auth.currentUser ? (
        <FlatList
  data={filteredAnnouncements}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.listContainer} // <- Add this line
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
          <Text
            style={[
              styles.cardText,
              { flexShrink: 1, marginLeft: isRead ? 0 : 12 },
            ]}
          >
            📣 {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
      </TouchableOpacity>
    );
  }}
  ListEmptyComponent={
    <Text style={styles.emptyText}>No announcements yet.</Text>
  }
/>

      ) : (
        <Text style={styles.emptyText}>Loading...</Text>
      )}
    </View>
  );
}
