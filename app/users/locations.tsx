import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { getAuth } from "firebase/auth";
import { get, getDatabase, onValue, ref, remove, set } from "firebase/database";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function Locations() {
  const [inputText, setInputText] = useState<string>("");
  const [locations, setLocations] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const router = useRouter();
  const auth = getAuth();
  const db = getDatabase();
  const uid = auth.currentUser?.uid;

  useEffect(() => {
    if (!uid) return;
    const locationsRef = ref(db, `users/${uid}/locations`);
    const unsubscribe = onValue(locationsRef, (snapshot) => {
      const data = snapshot.val();
      setLocations(data ? Object.values(data) : []);
    });
    return () => unsubscribe();
  }, [uid, db]);

  const availableLocations = [
    "Umlazi A", "Umlazi B", "Umlazi C", "Umlazi D", "Umlazi E",
    "Umlazi F", "Umlazi G", "Umlazi H", "Umlazi J", "Umlazi K",
    "Umlazi L", "Umlazi M", "Umlazi N", "Umlazi P", "Umlazi Q",
    "Umlazi R", "Umlazi S", "Umlazi T", "Umlazi U", "Umlazi V",
    "Umlazi W", "Umlazi Y", "Umlazi Z", "Umlazi AA", "Umlazi BB", "Umlazi CC",
  ];

  const filteredLocations = availableLocations.filter(loc =>
    loc.toLowerCase().includes(inputText.toLowerCase())
  );

  const addLocation = async () => {
    if (!inputText.trim()) {
      Alert.alert("Error", "Please enter or select a location.");
      return;
    }
    if (!filteredLocations.includes(inputText)) {
      Alert.alert("Invalid Location", "Please select a valid location from the suggestions.");
      return;
    }
    if (locations.includes(inputText)) {
      Alert.alert("Already Added", "This location is already in your list.");
      return;
    }
    const updatedLocations = [...locations, inputText];
    await set(ref(db, `users/${uid}/locations`), updatedLocations);
    setInputText("");
  };

  const removeLocation = async (location: string) => {
    const updated = locations.filter((item) => item !== location);
    await set(ref(db, `users/${uid}/locations`), updated);

    const selectedRef = ref(db, `users/${uid}/selectedLocation`);
    const snapshot = await get(selectedRef);
    if (snapshot.exists() && snapshot.val() === location) {
      await remove(selectedRef);
    }
  };

  const handleLocationPress = async (item: string) => {
    await set(ref(db, `users/${uid}/selectedLocation`), item);
    router.push("/users/schedules");
  };

  const renderSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => {
        setInputText(item);
        setIsFocused(false);
      }}
    >
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={styles.appName}>Locations</Text>
          <TouchableOpacity
            style={styles.helpButton}
            onPress={() => setHelpVisible(true)}
          >
            <Ionicons name="help-circle-outline" size={22} color="#1E90FF" />
            <Text style={styles.helpButtonText}>Help</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.searchInput, isFocused && styles.searchInputFocused]}
            placeholder="Type to search locations..."
            value={inputText}
            onChangeText={setInputText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          />
          {isFocused && inputText && filteredLocations.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <FlatList
                data={filteredLocations}
                keyExtractor={(item) => item}
                renderItem={renderSuggestion}
                style={styles.suggestionsList}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.addButton,
              !inputText || !filteredLocations.includes(inputText)
                ? { backgroundColor: "#b0c4de" }
                : { backgroundColor: "#1E90FF" },
            ]}
            onPress={addLocation}
            disabled={!inputText || !filteredLocations.includes(inputText)}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>Add Location</Text>
          </TouchableOpacity>
        </View>
                  <Text style={styles.subHeader}>My Areas</Text>

        <FlatList
          data={locations}
          keyExtractor={(item) => item}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No locations added yet.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleLocationPress(item)}
              activeOpacity={0.7}
              style={styles.locationItem}
            >
              <Ionicons name="location-outline" size={24} color="#1E90FF" style={{ marginRight: 8 }} />
              <Text style={styles.locationText}>{item}</Text>
              <TouchableOpacity onPress={() => removeLocation(item)} style={{ padding: 4 }}>
                <MaterialCommunityIcons name="delete-sweep-outline" size={28} color="black" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      </View>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Help</Text>
            <Text style={styles.modalText}>
              Type in the search bar to find a location. Select a location from the suggestions and
              tap &quot;Add Location&quot; to add it to your list. Tap a location in your list to set it as
              your active location. Tap the trash icon to remove a location from your list.
            </Text>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setHelpVisible(false)}>
              <Text style={styles.modalCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  fixedHeader: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    marginRight: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: "#1E90FF",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 100 : 80, // space below fixed header
    paddingHorizontal: 15,
  },
  subHeader: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 10,
  },
  inputContainer: {
    marginBottom: 20,
    width: "100%",
    position: "relative",
  },
  searchInput: {
    width: "100%",
    height: 44,
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#F8FAFF",
    color: "#222",
    marginBottom: 8,
  },
  searchInputFocused: {
    borderColor: "#1E90FF",
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  suggestionsContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  suggestionsList: {
    width: "100%",
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 10,
    color: "gray",
  },
  locationItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 14,
    color: "#1E90FF",
  },
  modalText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 20,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: "#1E90FF",
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalCloseButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
});
