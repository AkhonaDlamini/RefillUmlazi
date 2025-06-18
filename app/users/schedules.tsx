import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebaseConfig";

interface Schedule {
  id: string;
  location: string;
  day: string; // e.g. "Thursday"
  date: string; // e.g. "2025-06-19"
  startTime: string;
  endTime: string;
}

export default function DashboardScreen() {
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [groupedSchedules, setGroupedSchedules] = useState<
    Record<string, Schedule[]>
  >({});
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);

  const auth = getAuth();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;

    const selectedLocationRef = ref(db, `users/${uid}/selectedLocation`);
    const unsubscribeSelected = onValue(selectedLocationRef, (snapshot) => {
      const loc = snapshot.val();
      setSelectedLocation(loc || null);
    });

    return () => unsubscribeSelected();
  }, [uid]);

  useEffect(() => {
    const schedulesRef = ref(db, "admin/schedules");
    const unsubscribeSchedules = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loaded: Schedule[] = Object.entries(data).map(([id, value]: any) => ({
          id,
          ...value,
        }));
        setAllSchedules(loaded);
      } else {
        setAllSchedules([]);
      }
    });

    return () => unsubscribeSchedules();
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setGroupedSchedules({});
      return;
    }

    // Filter schedules by location (case-insensitive)
    const filtered = allSchedules.filter(
      (schedule) =>
        schedule.location.toLowerCase().trim() === selectedLocation.toLowerCase().trim()
    );

    // Group schedules by exact date string
    const grouped = filtered.reduce((acc, schedule) => {
      const date = schedule.date;
      if (!acc[date]) acc[date] = [];
      acc[date].push(schedule);
      return acc;
    }, {} as Record<string, Schedule[]>);

    setGroupedSchedules(grouped);
  }, [selectedLocation, allSchedules]);

  // Sort dates chronologically (ISO date strings naturally sort well)
  const sortedDates = Object.keys(groupedSchedules).sort((a, b) => a.localeCompare(b));

  // Helper: format date string to "Thursday, 19 June 2025"
  const formatDateHeader = (dateString: string) => {
    const dateObj = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    };
    return dateObj.toLocaleDateString("en-ZA", options);
  };

  const handleOpenProfileModal = () => {
    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to view your profile.");
      router.replace("/auth/login");
      return;
    }
    setEditingName(auth.currentUser.displayName || "");
    setProfileModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!editingName.trim()) {
      Alert.alert("Name required", "Display name cannot be empty.");
      return;
    }
    setSaving(true);
    try {
      if (!auth.currentUser) throw new Error("No authenticated user.");
      await updateProfile(auth.currentUser, { displayName: editingName.trim() });
      await update(ref(db, `users/${uid}`), { displayName: editingName.trim() });
      Alert.alert("Success", "Display name updated!");
      setProfileModalVisible(false);
    } catch (e) {
      console.error("Error updating display name:", e);
      Alert.alert("Error", "Could not update display name. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/auth/login");
    } catch (e) {
      console.error("Error logging out:", e);
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>Refill Umlazi</Text>
        <TouchableOpacity
          style={styles.profileIcon}
          onPress={handleOpenProfileModal}
        >
          <Ionicons name="person-circle-outline" size={30} color="#1E90FF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={profileModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile</Text>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>Email</Text>
              <Text style={styles.value}>{auth.currentUser?.email || "N/A"}</Text>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                style={styles.input}
                placeholder="Enter display name"
                placeholderTextColor="#888"
              />
              <Text style={styles.label}>Selected Location</Text>
              <Text style={styles.value}>{selectedLocation || "None"}</Text>
            </View>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveName}
              disabled={saving}
            >
              <Text style={styles.buttonText}>
                {saving ? "Saving..." : "Save Name"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton]}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setProfileModalVisible(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Text style={styles.subText}>
        {selectedLocation
          ? `Showing schedules for: ${selectedLocation}`
          : "No location selected."}
      </Text>

      {sortedDates.length === 0 ? (
        <Text style={styles.emptyText}>No schedules for this location.</Text>
      ) : (
        <FlatList
          data={sortedDates}
          keyExtractor={(date) => date}
          renderItem={({ item: date }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{formatDateHeader(date)}</Text>
              {groupedSchedules[date].map((schedule, index) => (
                <View
                  key={schedule.id}
                  style={[
                    styles.timeSlot,
                    index === groupedSchedules[date].length - 1 && styles.lastTimeSlot,
                  ]}
                >
                  <Text style={styles.scheduleTime}>
                    {schedule.startTime} - {schedule.endTime}
                  </Text>
                  <Text style={styles.scheduleSection}>
                    Section {schedule.location}
                  </Text>
                </View>
              ))}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", padding: 10 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#1E90FF",
  },
  appName: {
    flex: 1,
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF",
    textAlign: "center",
  },
  profileIcon: {
    paddingRight: 15,
    marginLeft: 15,
  },
  subText: {
    fontSize: 16,
    color: "#333",
    marginTop: 10,
    marginBottom: 5,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    marginTop: 30,
  },
  card: {
    backgroundColor: "#F8F9FA",
    borderRadius: 10,
    padding: 15,
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 8,
  },
  timeSlot: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  lastTimeSlot: {
    borderBottomWidth: 0,
    marginBottom: 0,
    paddingBottom: 0,
  },
  scheduleTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  scheduleSection: {
    fontSize: 14,
    color: "gray",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    width: "85%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 16,
  },
  profileInfo: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  value: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 8,
    width: "100%",
    marginBottom: 8,
    color: "#000",
  },
  button: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: "100%",
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#1E90FF",
  },
  logoutButton: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelText: {
    color: "#1E90FF",
    fontSize: 14,
  },
});
