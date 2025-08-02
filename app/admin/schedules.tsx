import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { onValue, push, ref, remove, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db } from "../../config/firebaseConfig";

interface Schedule {
  id: string;
  location: string;
  day: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDay, setSelectedDay] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    try {
      const schedulesRef = ref(db, "admin/schedules");
      const unsubscribe = onValue(schedulesRef, (snapshot) => {
        try {
          const data = snapshot.val();
          if (data) {
            const loadedSchedules: Schedule[] = Object.entries(data).map(
              ([id, value]: any) => ({
                id,
                ...value,
              })
            );
            setSchedules(loadedSchedules);
          } else {
            setSchedules([]);
          }
        } catch (err) {
          console.error("Error processing schedules data:", err);
          Alert.alert("Error", "Failed to load schedules. Please try again.");
        }
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up schedule listener:", error);
      Alert.alert("Error", "Could not fetch schedules.");
    }
  }, []);

  const isValidTime = (time: string) =>
    /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time);

  const isStartTimeBeforeEndTime = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return sh < eh || (sh === eh && sm < em);
  };

  const resetFields = () => {
    setSelectedLocation("");
    setSelectedDate(null);
    setSelectedDay("");
    setStartTime("");
    setEndTime("");
    setEditingId(null);
    setReason("");
  };

  const addOrUpdateSchedule = async () => {
    try {
      if (!selectedLocation || !selectedDate || !startTime || !endTime) {
        Alert.alert("Missing Fields", "Please make sure all fields are filled.");
        return;
      }

      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        Alert.alert("Invalid Time", "Use format HH:MM.");
        return;
      }

      if (!isStartTimeBeforeEndTime(startTime, endTime)) {
        Alert.alert("Invalid Time", "Start time must be before end time.");
        return;
      }

      const formattedDate = selectedDate.toISOString().split("T")[0];

      const scheduleData = {
        location: selectedLocation,
        day: selectedDay,
        date: formattedDate,
        startTime,
        endTime,
        reason,
      };

      if (editingId) {
        await update(ref(db, `admin/schedules/${editingId}`), scheduleData);
      } else {
        await push(ref(db, "admin/schedules"), scheduleData);
      }

      resetFields();
    } catch (error) {
      console.error("Error saving schedule:", error);
      Alert.alert("Error", "Failed to save schedule. Please try again.");
    }
  };

  const deleteSchedule = async (id: string) => {
    try {
      await remove(ref(db, `admin/schedules/${id}`));
    } catch (error) {
      console.error("Error deleting schedule:", error);
      Alert.alert("Error", "Failed to delete schedule.");
    }
  };

  const editSchedule = (schedule: Schedule) => {
    setSelectedLocation(schedule.location);
    setSelectedDay(schedule.day);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setEditingId(schedule.id);
    setSelectedDate(new Date(schedule.date));
    setReason(schedule.reason);
  };

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date: Date) => {
    setSelectedDate(date);
    const options = { weekday: "long" } as const;
    setSelectedDay(date.toLocaleDateString("en-US", options));
    hideDatePicker();
  };

  const getReasonTagStyle = (reason: string) => {
    const lower = reason.toLowerCase();

    if (lower.includes("maintenance")) {
      return { backgroundColor: "#FFD700", color: "#000" }; // Yellow
    } else if (lower.includes("burst") || lower.includes("pipe")) {
      return { backgroundColor: "#FF4C4C", color: "#fff" }; // Red
    } else if (lower.includes("inspection")) {
      return { backgroundColor: "#4B39EF", color: "#fff" }; // Blue
    } else if (lower.includes("upgrade")) {
      return { backgroundColor: "#32CD32", color: "#fff" }; // Green
    } else if (lower.includes("emergency")) {
      return { backgroundColor: "#8B0000", color: "#fff" }; // Dark Red
    } else {
      return { backgroundColor: "#ccc", color: "#333" }; // Default Gray
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.title}>Schedule Management</Text>
        <View style={styles.blueLine} />

        {/* Location Picker */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedLocation}
            onValueChange={setSelectedLocation}
            style={styles.picker}
            dropdownIconColor="#1E90FF"
          >
            <Picker.Item label="Select Affected Area" value="" />
            <Picker.Item label="Umlazi A" value="Umlazi A" />
            <Picker.Item label="Umlazi B" value="Umlazi B" />
            <Picker.Item label="Umlazi C" value="Umlazi C" />
            <Picker.Item label="Umlazi D" value="Umlazi D" />
            <Picker.Item label="Umlazi E" value="Umlazi E" />
            <Picker.Item label="Umlazi F" value="Umlazi F" />
            <Picker.Item label="Umlazi G" value="Umlazi G" />
            <Picker.Item label="Umlazi H" value="Umlazi G" />
            <Picker.Item label="Umlazi J" value="Umlazi J" />
            <Picker.Item label="Umlazi K" value="Umlazi K" />
            <Picker.Item label="Umlazi L" value="Umlazi L" />
            <Picker.Item label="Umlazi M" value="Umlazi M" />
            <Picker.Item label="Umlazi N" value="Umlazi N" />
            <Picker.Item label="Umlazi P" value="Umlazi P" />
            <Picker.Item label="Umlazi Q" value="Umlazi Q" />
            <Picker.Item label="Umlazi R" value="Umlazi R" />
            <Picker.Item label="Umlazi S" value="Umlazi S" />
            <Picker.Item label="Umlazi T" value="Umlazi T" />
            <Picker.Item label="Umlazi U" value="Umlazi U" />
            <Picker.Item label="Umlazi V" value="Umlazi V" />
            <Picker.Item label="Umlazi W" value="Umlazi W" />
            <Picker.Item label="Umlazi Y" value="Umlazi Y" />
            <Picker.Item label="Umlazi Z" value="Umlazi Z" />
            <Picker.Item label="Umlazi AA" value="Umlazi AA" />
            <Picker.Item label="Umlazi BB" value="Umlazi BB" />
            <Picker.Item label="Umlazi CC" value="Umlazi CC" />
          </Picker>
        </View>

        {/* Date Picker */}
        <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
          <Text style={styles.datePickerText}>
            {selectedDate
              ? `${selectedDate.toDateString()} (${selectedDay})`
              : "Select Date"}
          </Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="date"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
        />

        <TextInput
          placeholder="Start Time (HH:MM)"
          value={startTime}
          onChangeText={setStartTime}
          style={styles.input}
        />

        <TextInput
          placeholder="End Time (HH:MM)"
          value={endTime}
          onChangeText={setEndTime}
          style={styles.input}
        />

        <TextInput
          placeholder="Reason"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
        />

        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateSchedule}>
          <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>
            {editingId ? "Update" : "Add"} Schedule
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <FlatList
          data={schedules}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.scheduleItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>
                  {item.location} - {item.day}
                </Text>
                <Text style={styles.scheduleText}>
                  {item.date} | {item.startTime} to {item.endTime}
                </Text>
                {item.reason ? (
                  <View style={[styles.reasonTag, getReasonTagStyle(item.reason)]}>
                    <Text style={styles.reasonTagText}>
                      {item.reason}
                    </Text>
                  </View>
                ) : (
                  <Text style={{ color: "#999", fontStyle: "italic" }}>
                    Reason: Not provided
                  </Text>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => editSchedule(item)}>
                  <Ionicons name="create-outline" size={20} color="blue" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteSchedule(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          style={styles.scheduleList}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF", paddingHorizontal: 20 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF",
    marginBottom: 20,
    textAlign: "center",
    width: "100%",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    backgroundColor: "#F8F8F8",
    marginBottom: 10,
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: 49,
    color: "#333",
    backgroundColor: "transparent",
  },
  inputContainer: { marginTop: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 5,
    backgroundColor: "#F8F8F8",
    padding: 12,
    marginBottom: 10,
  },
  datePickerText: {
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#1E90FF",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    marginTop: 15,
  },
  addButtonText: {
    color: "#FFF",
    fontSize: 18,
    marginLeft: 10,
    fontWeight: "bold",
  },
  scheduleItem: {
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleText: { fontSize: 16, flex: 1, color: "#333" },
  scheduleList: { marginBottom: 40 },
  blueLine: {
    height: 1,
    backgroundColor: "#1E90FF",
    width: "100%",
    marginBottom: 16,
    alignSelf: "center",
  },
  cardTitle: { fontWeight: "bold", marginBottom: 4 },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginLeft: 10,
    gap: 10,
  },
  reasonTag: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  reasonTagText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
