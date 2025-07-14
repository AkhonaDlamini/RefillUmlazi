import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";
import React, { useEffect, useState, useContext } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { db } from "../../config/firebaseConfig";
import { ThemeContext } from "../../context/ThemeContext";

interface Schedule {
  id: string;
  location: string; // e.g., section name or station ID
  day: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  reason?: string;
}

export default function DashboardScreen() {
  const [allSchedules, setAllSchedules] = useState<Schedule[]>([]);
  const [groupedSchedules, setGroupedSchedules] = useState<Record<string, Schedule[]>>({});
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [saving, setSaving] = useState(false);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const auth = getAuth();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const selRef = ref(db, `users/${uid}/selectedLocation`);
    return onValue(selRef, (snap) => setSelectedLocation(snap.val() || null));
  }, [uid]);

  useEffect(() => {
    const schedRef = ref(db, "admin/schedules");
    return onValue(schedRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]: any) => ({
        id,
        ...val,
      }));
      setAllSchedules(list);
    });
  }, []);

  useEffect(() => {
    if (!selectedLocation) {
      setGroupedSchedules({});
      return;
    }
    const filtered = allSchedules.filter(
      (s) => s.location.trim().toLowerCase() === selectedLocation.trim().toLowerCase()
    );
    const grouped: Record<string, Schedule[]> = {};
    filtered.forEach((sch) => {
      if (!grouped[sch.date]) grouped[sch.date] = [];
      grouped[sch.date].push(sch);
    });
    setGroupedSchedules(grouped);
  }, [selectedLocation, allSchedules]);

  const sortedDates = Object.keys(groupedSchedules)
    .filter((date) => {
      const t = new Date(date);
      const n = new Date();
      t.setHours(0, 0, 0, 0);
      n.setHours(0, 0, 0, 0);
      return t >= n;
    })
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  const formatDateHeader = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-ZA", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#FFF" }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Refill Umlazi</Text>
        <TouchableOpacity style={styles.helpButton} onPress={handleOpenProfileModal}>
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
          <View style={[styles.modalContent, { backgroundColor: isDark ? "#222" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: "#1E90FF" }]}>Profile</Text>
            <View style={styles.profileInfo}>
              <Text style={[styles.label, { color: isDark ? "#fff" : "#333" }]}>Email</Text>
              <Text style={[styles.value, { color: isDark ? "#ccc" : "#666" }]}>
                {auth.currentUser?.email || "N/A"}
              </Text>

              <Text style={[styles.label, { color: isDark ? "#fff" : "#333" }]}>Display Name</Text>
              <TextInput
                value={editingName}
                onChangeText={setEditingName}
                style={[
                  styles.input,
                  {
                    color: isDark ? "#fff" : "#000",
                    borderColor: isDark ? "#444" : "#ccc",
                    backgroundColor: isDark ? "#181818" : "#fff",
                  },
                ]}
                placeholder="Enter display name"
                placeholderTextColor={isDark ? "#aaa" : "#888"}
              />

              <Text style={[styles.label, { color: isDark ? "#fff" : "#333" }]}>Selected Location</Text>
              <Text style={[styles.value, { color: isDark ? "#ccc" : "#666" }]}>
                {selectedLocation || "None"}
              </Text>

              {/* Dark Mode Toggle */}
              <View style={styles.option}>
                <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>Dark Mode</Text>
                <Switch value={isDark} onValueChange={toggleTheme} />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSaveName}
              disabled={saving}
            >
              <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Name"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
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

      <Text style={[styles.subText, { color: isDark ? "#ccc" : "#333" }]}>
        {selectedLocation ? `Showing schedules for: ${selectedLocation}` : "No location selected."}
      </Text>

      {sortedDates.length === 0 ? (
        <Text style={[styles.emptyText, { color: isDark ? "#888" : "gray" }]}>
          No upcoming schedules.
        </Text>
      ) : (
        <FlatList
          data={sortedDates}
          keyExtractor={(d) => d}
          renderItem={({ item: date }) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(date);
            target.setHours(0, 0, 0, 0);
            const diff = (target.getTime() - today.getTime()) / (1000 * 3600 * 24);
            let badgeText = formatDateHeader(date),
              badgeColor = "#888";
            if (diff === 0) {
              badgeText = "Today";
              badgeColor = "#1E90FF";
            } else if (diff === 1) {
              badgeText = "Tomorrow";
              badgeColor = "#FF6347";
            }

            return (
              <View style={{ marginVertical: 8, paddingHorizontal: 16 }}>
                {groupedSchedules[date].map((sch) => (
                  <View
                    key={sch.id}
                    style={[
                      styles.outageCard,
                      { backgroundColor: isDark ? "#1e1e1e" : "#F9FAFB" },
                    ]}
                  >
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.outageTitle, { color: isDark ? "#FFF" : "#000" }]}>
                        {sch.location}
                      </Text>
                      <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                        <Text style={styles.badgeText}>{badgeText}</Text>
                      </View>
                    </View>

                    <Text style={[styles.outageLabel, { color: isDark ? "#aaa" : "#333" }]}>Time:</Text>
                    <Text style={[styles.outageText, { color: isDark ? "#ccc" : "#666" }]}>
                      {sch.startTime} — {sch.endTime}
                    </Text>

                    <Text style={[styles.outageLabel, { color: isDark ? "#aaa" : "#333" }]}>Reason:</Text>
                    <Text style={[styles.outageText, { color: isDark ? "#ccc" : "#666" }]}>
                      {sch.reason || "N/A"}
                    </Text>
                  </View>
                ))}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
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
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
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
  outageCard: {
    backgroundColor: "#F9FAFB",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  outageTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  outageLabel: {
    fontWeight: "600",
    marginTop: 5,
  },
  outageText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
