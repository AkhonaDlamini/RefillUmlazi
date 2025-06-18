// RefillStations.tsx

import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import { onValue, push, ref, remove, update } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import MapView, { MapPressEvent, Marker } from 'react-native-maps';
import { db } from '../../config/firebaseConfig';

interface RefillStation {
  id: string;
  location: string;
  address: string;
  stationNumber: string;
  waterAvailable: boolean;
  createdAt: string;
  latitude: number;
  longitude: number;
}

export default function RefillStations() {
  const [stations, setStations] = useState<RefillStation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [address, setAddress] = useState('');
  const [stationNumber, setStationNumber] = useState('');
  const [waterAvailable, setWaterAvailable] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const mapRef = useRef<MapView>(null);
  useWindowDimensions();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const locationCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'Umlazi A': { latitude: -29.9589, longitude: 30.9173 },
    'Umlazi B': { latitude: -29.9660, longitude: 30.9270 },
    'Umlazi C': { latitude: -29.9522, longitude: 30.9030 },
    'Umlazi D': { latitude: -29.9678, longitude: 30.9030 },
    'Umlazi E': { latitude: -29.9483, longitude: 30.9159 },
    'Umlazi F': { latitude: -29.9740, longitude: 30.8930 },
    'Umlazi G': { latitude: -29.9460, longitude: 30.8815 },
    'Umlazi H': { latitude: -29.9490, longitude: 30.8700 },
    'Umlazi I': { latitude: -29.9688, longitude: 30.8843 },
    'Umlazi J': { latitude: -29.9520, longitude: 30.8585 },
    'Umlazi K': { latitude: -29.9656, longitude: 30.8513 },
    'Umlazi L': { latitude: -29.9678, longitude: 30.8628 },
  };

  useEffect(() => {
    const stationsRef = ref(db, 'admin/refill-stations');
    const unsubscribe = onValue(stationsRef, (snap) => {
      const data = snap.val();
      const arr: RefillStation[] = data
        ? Object.entries(data).map(([id, v]: any) => ({ id, ...v }))
        : [];
      setStations(arr);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedLocation && locationCoordinates[selectedLocation]) {
      const { latitude, longitude } = locationCoordinates[selectedLocation];
      mapRef.current?.animateToRegion(
        { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        1000
      );
    }
  }, [selectedLocation, locationCoordinates]);

  const resetFields = () => {
    setSelectedLocation('');
    setAddress('');
    setStationNumber('');
    setWaterAvailable(true);
    setLatitude('');
    setLongitude('');
    setEditingId(null);
  };

  const addOrUpdateStation = () => {
    if (!selectedLocation || !address || !stationNumber || !latitude || !longitude) {
      Alert.alert('Missing Fields', 'Please fill in all fields including coordinates.');
      return;
    }
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    if (isNaN(lat)||isNaN(lon)||lat < -90||lat > 90||lon < -180||lon > 180) {
      Alert.alert('Invalid Coordinates', 'Please enter valid range for lat/lng.');
      return;
    }
    const data = {
      location: selectedLocation,
      address,
      stationNumber,
      waterAvailable,
      createdAt: new Date().toISOString(),
      latitude: lat,
      longitude: lon,
    };
    const dbRef = editingId
      ? ref(db, `admin/refill-stations/${editingId}`)
      : ref(db, 'admin/refill-stations');
    const dbCall = editingId ? update : push;
    dbCall(dbRef, data)
      .then(() => {
        Alert.alert('Success', editingId ? 'Station updated' : 'Station added');
        resetFields();
      })
      .catch((err) => Alert.alert('Error', err.message));
  };

  const deleteStation = (id: string) => {
    Alert.alert('Delete Station', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(ref(db, `admin/refill-stations/${id}`));
          if (editingId === id) resetFields();
        },
      },
    ]);
  };

  const editStation = (s: RefillStation) => {
    setSelectedLocation(s.location);
    setAddress(s.address);
    setStationNumber(s.stationNumber);
    setWaterAvailable(s.waterAvailable);
    setLatitude(String(s.latitude));
    setLongitude(String(s.longitude));
    setEditingId(s.id);
    mapRef.current?.animateToRegion(
      { latitude: s.latitude, longitude: s.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      1000
    );
  };

  const handleMapPress = async (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setLatitude(latitude.toFixed(6));
    setLongitude(longitude.toFixed(6));
    try {
      const res = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (res.length) {
        const p = res[0];
        const addr = `${p.name ?? ''} ${p.street ?? ''}}`.trim();
        setAddress(addr);
      }
    } catch (err) {
      console.error('Geocode error', err);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Consistent App Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitleSA}>Refill Stations Management</Text>
      </View>
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            {/*<Text style={styles.headerTitle}>{editingId ? 'Update' : 'Add'} Refill Station</Text>*/}
            <View style={{ borderRadius: 5, overflow: 'hidden', marginBottom: 12, backgroundColor: '#f0f0f0' }}>
              <Picker
                selectedValue={selectedLocation}
                onValueChange={setSelectedLocation}
                style={styles.picker}
              >
                <Picker.Item label="--Choose Location--" value="" />
                {Object.keys(locationCoordinates).map((loc) => (
                  <Picker.Item key={loc} label={loc} value={loc} />
                ))}
              </Picker>
            </View>
            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
            <TextInput
              style={styles.input}
              placeholder="Station Number"
              value={stationNumber}
              keyboardType="numeric"
              onChangeText={(t) => setStationNumber(t.replace(/[^0-9]/g, ''))}
            />
            <TextInput style={styles.input} placeholder="Latitude" value={latitude} onChangeText={setLatitude} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Longitude" value={longitude} onChangeText={setLongitude} keyboardType="numeric" />
            <MapView
              ref={mapRef}
              style={styles.map}
              initialRegion={{ latitude: -29.964, longitude: 30.925, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
              onPress={handleMapPress}
            >
              {latitude && longitude && (
                <Marker
                  coordinate={{ latitude: parseFloat(latitude), longitude: parseFloat(longitude) }}
                  pinColor="green"
                />
              )}
            </MapView>
            <TouchableOpacity onPress={() => setWaterAvailable(!waterAvailable)} style={styles.toggleBtn}>
              <Text style={styles.toggleTxt}>Water Available: {waterAvailable ? 'Yes' : 'No'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={addOrUpdateStation} style={styles.addBtn}>
              <Ionicons name={editingId ? 'create-outline' : 'add-circle-outline'} size={20} color="#fff" />
              <Text style={styles.btnText}>{editingId ? 'Update' : 'Add'} Station</Text>
            </TouchableOpacity>
            <Text style={styles.listTitle}>Existing Stations</Text>
          </View>
        }
        data={stations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.stationCard}>
            <Text style={styles.cardTitle}>{item.location} - Station {item.stationNumber}</Text>
            <Text>{item.address}</Text>
            <Text>
              Water:{" "}
              <Text style={{ color: item.waterAvailable ? "green" : "red", fontWeight: "bold" }}>
                {item.waterAvailable ? "Yes" : "No"}
              </Text>
            </Text>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => editStation(item)}>
                <Ionicons name="create-outline" size={20} color="blue" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => deleteStation(item.id)}>
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        keyboardShouldPersistTaps="handled"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1E90FF",
    backgroundColor: "#fff",
  },
  headerTitleSA: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E90FF",
  },
  headerWrap: { padding: 16, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  picker: {
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    paddingHorizontal: 2,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  map: { height: 200, marginBottom: 12, borderRadius: 8 },
  toggleBtn: { backgroundColor: '#eee', padding: 10, marginBottom: 12, borderRadius: 6, alignItems: 'center' },
  toggleTxt: { fontWeight: 'bold' },
  addBtn: { flexDirection: 'row', backgroundColor: '#1E90FF', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  btnText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
  listTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: '#1E90FF' },
  stationCard: { padding: 12, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginBottom: 12 },
  cardTitle: { fontWeight: 'bold', marginBottom: 4 },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, gap: 10 },
});
