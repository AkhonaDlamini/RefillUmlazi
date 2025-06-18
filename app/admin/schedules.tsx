import { Ionicons } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { onValue, push, ref, remove, update } from "firebase/database";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { db } from "../../config/firebaseConfig";

interface Schedule {
  id: string;
  location: string;
  day: string;
  startTime: string;
  endTime: string;
}

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const schedulesRef = ref(db, "admin/schedules");
    const unsubscribe = onValue(schedulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedSchedules: Schedule[] = Object.entries(data).map(([id, value]: any) => ({
          id,
          ...value,
        }));
        setSchedules(loadedSchedules);
      } else {
        setSchedules([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const isValidTime = (time: string) => /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/.test(time);
  const isStartTimeBeforeEndTime = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return sh < eh || (sh === eh && sm < em);
  };

  const resetFields = () => {
    setSelectedLocation("");
    setSelectedDay("");
    setStartTime("");
    setEndTime("");
    setEditingId(null);
  };

  const addOrUpdateSchedule = () => {
    if (!selectedLocation || !selectedDay || !startTime || !endTime) {
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

    const scheduleData = { location: selectedLocation, day: selectedDay, startTime, endTime };

    if (editingId) {
      update(ref(db, `admin/schedules/${editingId}`), scheduleData);
    } else {
      push(ref(db, "admin/schedules"), scheduleData);
    }
    resetFields();
  };

  const deleteSchedule = (id: string) => remove(ref(db, `admin/schedules/${id}`));
  const editSchedule = (schedule: Schedule) => {
    setSelectedLocation(schedule.location);
    setSelectedDay(schedule.day);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setEditingId(schedule.id);
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
            <Picker.Item label="Select Location" value="" />
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

        {/* Day Picker */}
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={selectedDay}
            onValueChange={setSelectedDay}
            style={styles.picker}
            dropdownIconColor="#1E90FF"
          >
            <Picker.Item label="Select Day" value="" />
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
              <Picker.Item key={day} label={day} value={day} />
            ))}
          </Picker>
        </View>

        <TextInput placeholder="Start Time (HH:MM)" value={startTime} onChangeText={setStartTime} style={styles.input} />
        <TextInput placeholder="End Time (HH:MM)" value={endTime} onChangeText={setEndTime} style={styles.input} />

        <TouchableOpacity style={styles.addButton} onPress={addOrUpdateSchedule}>
          <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          <Text style={styles.addButtonText}>{editingId ? "Update" : "Add"} Schedule</Text>
        </TouchableOpacity>

        {/* Add this spacer for separation */}
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
                  {item.startTime} to {item.endTime}
                </Text>
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
  title: { fontSize: 24, fontWeight: "bold", color: "#1E90FF", marginBottom: 20, textAlign: "center", width: "100%" },
  inputContainer: { marginTop: 20 },
  label: {
    fontSize: 16,
    color: "#1E90FF",
    marginBottom: 4,
    marginTop: 10,
    fontWeight: "bold",
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
    height: 50,
    color: "#333",
    backgroundColor: "transparent",
  },
  marginTop: { marginTop: 20 },
  input: { borderWidth: 1, borderColor: "#DDD", padding: 10, marginVertical: 5, borderRadius: 5 },
  addButton: {
    flexDirection: 'row',
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16, // add this for spacing below the button
    marginTop: 15,    // keep if you want spacing above as well
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 18,
    marginLeft: 10,
    fontWeight: 'bold', // optional for consistency
  },
  scheduleItem: {
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
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
  cardTitle: { fontWeight: 'bold', marginBottom: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginLeft: 10, gap: 10 },
});
