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
  const [error, setError] = useState<string | null>(null);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const auth = getAuth();
  const router = useRouter();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    try {
      const selRef = ref(db, `users/${uid}/selectedLocation`);
      return onValue(selRef, (snap) => setSelectedLocation(snap.val() || null), (err) => {
        console.error(err);
        setError("Could not load selected location. Please try again later.");
        Alert.alert("Error", "Could not load selected location. Please try again later.");
      });
    } catch (e) {
      console.error(e);
      setError("Could not load selected location. Please try again later.");
      Alert.alert("Error", "Could not load selected location. Please try again later.");
    }
  }, [uid]);

  useEffect(() => {
    try {
      const schedRef = ref(db, "admin/schedules");
      return onValue(schedRef, (snap) => {
        const data = snap.val() || {};
        const list = Object.entries(data).map(([id, val]: any) => ({
          id,
          ...val,
        }));
        setAllSchedules(list);
      }, (err) => {
        console.error(err);
        setError("Could not load schedules. Please try again later.");
        Alert.alert("Error", "Could not load schedules. Please try again later.");
      });
    } catch (e) {
      console.error(e);
      setError("Could not load schedules. Please try again later.");
      Alert.alert("Error", "Could not load schedules. Please try again later.");
    }
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
      setError("Could not update display name. Please try again.");
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
      setError("Could not log out. Please try again.");
      Alert.alert("Error", "Could not log out. Please try again.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#FFF" }]}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Refill Umlazi</Text>
        <TouchableOpacity style={styles.helpButton} onPress={handleOpenProfileModal}>
          <Ionicons name="person-circle-outline" size={35} color="#1E90FF" style={{ marginTop: 8 }}/>
        </TouchableOpacity>
      </View>

     <Modal
  visible={profileModalVisible}
  transparent
  animationType="slide"
  onRequestClose={() => setProfileModalVisible(false)}
>
  <View style={styles.modalOverlay}>
    <View style={[styles.modalContent, { backgroundColor: isDark ? "#1e1e1e" : "#FFF" }]}>
      <Text style={[styles.modalTitle, { color: isDark ? "#FFF" : "#1E90FF" }]}>Profile</Text>

      <View style={styles.profileInfo}>
        <Text style={[styles.label, { color: isDark ? "#bbb" : "#444" }]}>Email</Text>
        <Text style={[styles.value, { color: isDark ? "#ccc" : "#666" }]}>
          {auth.currentUser?.email || "N/A"}
        </Text>

        <Text style={[styles.label, { color: isDark ? "#bbb" : "#444" }]}>Display Name</Text>
        <TextInput
          value={editingName}
          onChangeText={setEditingName}
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#2b2b2b" : "#F2F4F6",
              color: isDark ? "#fff" : "#000",
              borderColor: isDark ? "#444" : "#ccc",
            },
          ]}
          placeholder="Enter your name"
          placeholderTextColor={isDark ? "#888" : "#aaa"}
        />

        <Text style={[styles.label, { color: isDark ? "#bbb" : "#444" }]}>Selected Location</Text>
        <Text style={[styles.value, { color: isDark ? "#ccc" : "#666" }]}>
          {selectedLocation || "None"}
        </Text>

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
        <Text style={styles.buttonText}>{saving ? "Saving..." : "Save Changes"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.cancelButton} onPress={() => setProfileModalVisible(false)}>
        <Text style={styles.cancelText}>Close</Text>
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
                      { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
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
      {error && (
        <View style={{ padding: 10 }}>
          <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
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
    //marginBottom: 5,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "gray",
    textAlign: "center",
    //marginTop: 30,
  },
 modalOverlay: {
  flex: 1,
  backgroundColor: "rgba(0,0,0,0.5)",
  justifyContent: "center",
  alignItems: "center",
},
modalContent: {
  borderRadius: 16,
  padding: 24,
  width: "90%",
  shadowColor: "#000",
  shadowOpacity: 0.25,
  shadowRadius: 10,
  elevation: 10,
},
modalTitle: {
  fontSize: 22,
  fontWeight: "bold",
  //marginBottom: 20,
  textAlign: "center",
},
profileInfo: {
  width: "100%",
  gap: 12,
  //marginBottom: 20,
},
label: {
  fontSize: 14,
  fontWeight: "600",
  //marginBottom: 4,
},
value: {
  fontSize: 14,
  //marginBottom: 2,
},
input: {
  borderWidth: 1,
  borderRadius: 10,
  paddingVertical: 10,
  paddingHorizontal: 14,
  fontSize: 14,
},
option: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  //marginTop: 16,
},
button: {
  borderRadius: 10,
  paddingVertical: 12,
  alignItems: "center",
  width: "100%",
  marginTop: 10,
},
saveButton: {
  backgroundColor: "#1E90FF",
},
logoutButton: {
  backgroundColor: "#FF4D4F",
},
buttonText: {
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
},
cancelButton: {
  marginTop: 8,
},
cancelText: {
  color: "#1E90FF",
  fontSize: 14,
  fontWeight: "600",
  textAlign: "center",
},
  outageCard: {
    backgroundColor: "#FFFFFF",
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
