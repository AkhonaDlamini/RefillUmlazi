import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../../config/firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, get } from "firebase/database";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const roleRef = ref(db, `users/${user.uid}/role`);
          const snapshot = await get(roleRef);
          const role = snapshot.val();

          if (role === "admin") {
            setIsAdmin(true);
          } else {
            router.replace("/auth/login");
          }
        } catch (err) {
          console.error("Role check failed", err);
          router.replace("/auth/login");
        }
      } else {
        router.replace("/auth/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert("Error", "Failed to sign out.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}> Dashboard</Text>
        <TouchableOpacity style={styles.profileIcon} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={30} color="#FF6347" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/schedules")}
        >
          <Ionicons name="calendar" size={24} color="#1E90FF" style={styles.cardIcon} />
          <Text style={styles.cardText}>Manage Schedules</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/refill-stations")}
        >
          <Ionicons name="water" size={24} color="#1E90FF" style={styles.cardIcon} />
          <Text style={styles.cardText}>Manage Refill Stations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/chats")}
        >
          <Ionicons name="chatbox-ellipses" size={24} color="#1E90FF" style={styles.cardIcon} />
          <Text style={styles.cardText}>View Chats</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/admin/announcements")}
        >
          <Ionicons name="megaphone" size={24} color="#1E90FF" style={styles.cardIcon} />
          <Text style={styles.cardText}>Post Announcements</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E90FF",
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF",
    marginLeft: 15,
  },
  profileIcon: {
    marginRight: 15,
  },
  cardsContainer: {
    flex: 1,
    marginTop: 20,
    paddingHorizontal: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: "center",
    elevation: 3,
  },
  cardIcon: {
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E90FF",
    textAlign: "center",
  },
  signOutButton: {
    backgroundColor: "#FF6347",
    padding: 12,
    width: "100%",
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  signOutText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
