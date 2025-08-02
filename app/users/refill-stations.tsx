import { Ionicons } from '@expo/vector-icons';
import { getDatabase, onValue, ref } from 'firebase/database';
import React, { useEffect, useRef, useState, useContext } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { ThemeContext } from '../../context/ThemeContext';

type RefillStation = {
  id: string;
  location: string;
  address: string;
  stationNumber: string;
  waterAvailable: boolean;
  createdAt: string;
  latitude: number;
  longitude: number;
};

export default function RefillStationScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refillStations, setRefillStations] = useState<RefillStation[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useContext(ThemeContext);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    try {
      const db = getDatabase();
      const stationRef = ref(db, 'admin/refill-stations');
      onValue(
        stationRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const stationsArray: RefillStation[] = Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
              latitude: Number(data[key].latitude),
              longitude: Number(data[key].longitude),
            }));
            setRefillStations(stationsArray);
          } else {
            setRefillStations([]);
          }
        },
        (err) => {
          console.error(err);
          setError("Could not load refill stations. Please try again later.");
          Alert.alert("Error", "Could not load refill stations. Please try again later.");
        }
      );
    } catch (e) {
      console.error(e);
      setError("Could not load refill stations. Please try again later.");
      Alert.alert("Error", "Could not load refill stations. Please try again later.");
    }
  }, []);

  const filteredStations = refillStations.filter((station) =>
    station.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (searchQuery.length > 0) {
      const matches = Array.from(
        new Set(
          refillStations
            .map((s) => s.location)
            .filter((loc) => loc.toLowerCase().startsWith(searchQuery.toLowerCase()))
        )
      );
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery, refillStations]);

  const handleSuggestionPress = (location: string) => {
    setSearchQuery(location);
    setShowSuggestions(false);
  };

  const initialRegion = {
    latitude: -29.964,
    longitude: 30.925,
    latitudeDelta: 0.03,
    longitudeDelta: 0.03,
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const focusMapOnStation = (station: RefillStation) => {
    mapRef.current?.animateToRegion(
      {
        latitude: station.latitude,
        longitude: station.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );
  };

  useEffect(() => {
    if (searchQuery.length > 0) {
      const station = refillStations.find(
        (s) => s.location.toLowerCase() === searchQuery.toLowerCase()
      );
      if (station) {
        focusMapOnStation(station);
      }
    }
  }, [searchQuery, refillStations]);

  const openDirections = async (lat: number, lng: number, label: string) => {
  try {
    const latLng = `${lat},${lng}`;
    const labelEncoded = encodeURIComponent(label);

    let url = '';
    if (Platform.OS === 'ios') {
      // Apple Maps
      url = `http://maps.apple.com/?ll=${latLng}&q=${labelEncoded}`;
    } else {
      // Google Maps
      url = `https://www.google.com/maps/dir/?api=1&destination=${latLng}&travelmode=driving`;
    }

    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No Map App', 'Could not open map. Please check your device.');
    }
  } catch (error) {
    console.error('Navigation error:', error);
    Alert.alert('Error', 'Failed to open directions.');
  }
};
;

  const getStatusColor = (available: boolean) =>
    available
      ? { color: '#2E7D32', bgColor: '#C8E6C9' }
      : { color: '#D32F2F', bgColor: '#FFCDD2' };

  const getStatusIcon = (available: boolean) => (available ? 'water' : 'warning');

  const getStatusText = (available: boolean) => (available ? 'Available' : 'Unavailable');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#181818' : '#fff' }]}>
      <View style={[styles.fixedTop, { backgroundColor: isDark ? '#181818' : '#fff' }]}>
        <View style={styles.header}>
          <View style={{ width: 32 }} />
          <Text style={[styles.appName, { color: '#1E90FF' }]}>Refill Stations</Text>
          <TouchableOpacity style={styles.helpButton} onPress={() => setHelpVisible(true)}>
            <Ionicons name="help-circle-outline" size={22} color="#1E90FF" />
            <Text style={styles.helpButtonText}>Help</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.searchContainer, { backgroundColor: isDark ? '#23272b' : '#F1F1F1' }]}>
          <TextInput
            style={[styles.searchInput, { color: isDark ? '#fff' : '#333' }]}
            placeholder="Search by section name"
            placeholderTextColor={isDark ? '#aaa' : '#888'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => {
              setSearchQuery('');
              setShowSuggestions(false);
            }}
          >
            <Ionicons name="close-circle" size={26} color={isDark ? '#888' : '#999'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.mapContainer, { borderColor: isDark ? '#444' : '#ddd' }]}>
          <MapView ref={mapRef} style={styles.map} initialRegion={initialRegion}>
            {refillStations.map((station) => (
              <Marker
                key={station.id}
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                title={station.location}
                pinColor={station.waterAvailable ? 'dodgerblue' : 'red'}
              >
                <Callout tooltip={false}>
                  <View style={{ maxWidth: 200 }}>
                    <Text style={{ fontWeight: 'bold', color: isDark ? '#fff' : '#222' }}>
                      {station.location}
                    </Text>
                    <Text style={{ color: isDark ? '#ccc' : '#222' }}>{station.address}</Text>
                    <Text style={{ color: isDark ? '#ccc' : '#222' }}>
                      Station No: {station.stationNumber}
                    </Text>
                    <Text style={{ color: isDark ? '#ccc' : '#222' }}>
                      Water: {getStatusText(station.waterAvailable)}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: isDark ? '#aaa' : '#444',
                      }}
                    >
                      Last Updated: {formatDate(station.createdAt)}
                    </Text>
                    <TouchableOpacity
                      style={{
                        marginTop: 8,
                        backgroundColor: '#1E90FF',
                        borderRadius: 6,
                        padding: 6,
                      }}
                      onPress={() =>
                        openDirections(station.latitude, station.longitude, station.location)
                      }
                    >
                      <Text style={{ color: '#fff', textAlign: 'center' }}>Get Directions</Text>
                    </TouchableOpacity>
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>
        </View>
        <View style={styles.recommendedHeader}>
          <Ionicons name="navigate" size={18} color="#1E90FF" />
          <Text style={styles.recommendedText}>Recommended Nearby</Text>
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View
            style={[
              styles.suggestionBox,
              { backgroundColor: isDark ? '#23272b' : '#fff', borderColor: isDark ? '#444' : '#ddd' },
            ]}
          >
            <ScrollView>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => handleSuggestionPress(s)}
                  style={styles.suggestionItem}
                >
                  <Text style={[styles.suggestionText, { color: isDark ? '#fff' : '#444' }]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredStations}
        keyExtractor={(item) => item.id}
        style={{ marginTop: 360 }}
        renderItem={({ item }) => {
          const status = getStatusColor(item.waterAvailable);
          return (
            <TouchableOpacity onPress={() => focusMapOnStation(item)}>
              <View style={[styles.stationCard, { backgroundColor: isDark ? '#1E1E1E' : '#fff' }]}>
                <View style={[styles.stationIconContainer, { backgroundColor: status.bgColor }]}>
                  <Ionicons name={getStatusIcon(item.waterAvailable)} size={28} color={status.color} />
                </View>
                <View style={styles.stationDetails}>
                  <View style={styles.stationHeader}>
                    <Text style={styles.stationName}>{item.location}</Text>
                    <View style={[styles.statusIndicator, { backgroundColor: status.color }]} />
                  </View>
                  <Text style={styles.stationAddress}>{item.address}</Text>
                  <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
                      <Ionicons name={getStatusIcon(item.waterAvailable)} size={16} color={status.color} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {getStatusText(item.waterAvailable)}
                      </Text>
                    </View>
                    <View style={styles.stationNumberBadge}>
                      <Ionicons name="location-outline" size={16} color="#757575" />
                      <Text style={styles.stationNumberText}>{item.stationNumber}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.noResultsText}>No refill stations found for {searchQuery}</Text>
        }
      />

      {/* Help Modal */}
      <Modal
        visible={helpVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#23272b' : '#fff' }]}>
            <Text style={styles.modalTitle}>Help</Text>
            <Text style={[styles.modalText, { color: isDark ? '#fff' : '#444' }, { marginBottom: 20 }]}>
              This screen shows a searchable map and list of water refill stations in Umlazi.
              Tap on any station card to focus on its location on the map.
              Markers show the station location. Colored badges indicate water status: green =
              available, red = unavailable.
            </Text>
            <TouchableOpacity
              style={[styles.modalCloseButton, { marginTop: 20 }]}
              onPress={() => setHelpVisible(false)}
            >
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
    backgroundColor: '#F7F7F7',
  },
  fixedTop: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 0 : 20,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 15,
  },
  header: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 10,
    borderBottomColor: '#1E90FF',
    borderBottomWidth: 1,
  },
  recommendedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    marginHorizontal: 15,
    gap: 6,
  },

  recommendedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E90FF',
  },

  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    marginRight: 8,
  },
  helpButtonText: {
    fontSize: 14,
    color: '#1E90FF',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 0,
    marginBottom: 10,
    backgroundColor: '#F1F1F1',
    borderRadius: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
  },
  searchButton: {
    padding: 8,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  suggestionBox: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 90,
    left: 15,
    right: 15,
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingBottom: 8,
    maxHeight: 150,
    zIndex: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  suggestionText: {
    padding: 12,
    fontSize: 16,
    color: '#444',
  },
  noResultsText: {
    marginTop: 20,
    marginHorizontal: 15,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  stationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 15,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    alignItems: 'center',
  },
  stationIconContainer: {
    padding: 14,
    borderRadius: 30,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stationDetails: {
    flex: 1,
  },
  stationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stationName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#1E90FF',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationAddress: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b6b6b',
  },
  statusContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 12,
  },
  statusText: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  stationNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 30,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  stationNumberText: {
    marginLeft: 8,
    color: '#757575',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 14,
    color: '#1E90FF',
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalCloseButton: {
    backgroundColor: '#1E90FF',
    paddingVertical: 12,
    borderRadius: 14,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },

  suggestionItem: {
    backgroundColor: '#fff',
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
});
