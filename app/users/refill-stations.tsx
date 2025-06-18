import { Ionicons } from '@expo/vector-icons';
import { getDatabase, onValue, ref } from 'firebase/database';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList,Linking, Modal,Platform,StyleSheet,Text,TextInput,TouchableOpacity,View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

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

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const db = getDatabase();
    const stationRef = ref(db, 'admin/refill-stations');

    onValue(stationRef, (snapshot) => {
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
    });
  }, []);

  // Filtered results
  const filteredStations = refillStations.filter((station) =>
    station.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Suggestions logic
  useEffect(() => {
    if (searchQuery.length > 0) {
      const matches = Array.from(
        new Set(
          refillStations
            .map((s) => s.location)
            .filter((loc) =>
              loc.toLowerCase().startsWith(searchQuery.toLowerCase())
            )
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
        latitudeDelta: 0.01, // zoom in
        longitudeDelta: 0.01,
      },
      1000 // duration in ms
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

  const openDirections = (lat: number, lng: number, label: string) => {
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodeURIComponent(label)}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Helper functions for status
  const getStatusColor = (waterAvailable: boolean) => {
    if (waterAvailable) {
      return { color: '#2E7D32', bgColor: '#C8E6C9' }; // green tones
    } else {
      return { color: '#D32F2F', bgColor: '#FFCDD2' }; // red tones
    }
  };

  const getStatusIcon = (waterAvailable: boolean) => {
    return waterAvailable ? 'water' : 'warning';
  };

  const getStatusText = (waterAvailable: boolean) => {
    return waterAvailable ? 'Available' : 'Unavailable';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ width: 32 }} /> {/* Spacer for symmetry */}
        <Text style={styles.appName}>Refill Stations</Text>
        <TouchableOpacity
          style={styles.helpIcon}
          onPress={() => setHelpVisible(true)}
          accessibilityLabel="Help"
        >
          <Ionicons name="help-circle-outline" size={28} color="#1E90FF" />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by section name"
          placeholderTextColor="#888"
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
          <Ionicons name="close-circle" size={26} color="#999" />
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={initialRegion}
        >
          {refillStations.map((station) => (
            <Marker
              key={station.id}
              coordinate={{ latitude: station.latitude, longitude: station.longitude }}
              title={station.location}
              pinColor={station.waterAvailable ? 'dodgerblue' : 'red'}
            >
              <Callout>
                <View style={{ maxWidth: 200 }}>
                  <Text style={{ fontWeight: 'bold' }}>{station.location}</Text>
                  <Text> {station.address}</Text>
                  <Text> Station No: {station.stationNumber}</Text>
                  <Text>
                    Water: {station.waterAvailable ? 'Available' : 'Unavailable'}
                  </Text>
                  <Text style={{ fontSize: 11, marginTop: 4 }}>
                    Last Updated: {formatDate(station.createdAt)}
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 8, backgroundColor: '#1E90FF', borderRadius: 6, padding: 6 }}
                    onPress={() => openDirections(station.latitude, station.longitude, station.location)}
                  >
                    <Text style={{ color: '#fff', textAlign: 'center' }}>Get Directions</Text>
                  </TouchableOpacity>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      </View>

      {/* Suggestion list */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionBox}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity key={suggestion} onPress={() => handleSuggestionPress(suggestion)}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Station Cards */}
      {filteredStations.length === 0 ? (
        <Text style={styles.noResultsText}>No refill stations found for {searchQuery}</Text>
      ) : (
        <FlatList
          data={filteredStations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const status = getStatusColor(item.waterAvailable);
            return (
              <TouchableOpacity onPress={() => focusMapOnStation(item)}>
                <View style={styles.stationCard}>
                  <View style={styles.stationIconContainer}>
                    <Ionicons name="water" size={30} color="white" />
                  </View>
                  <View style={styles.stationDetails}>
                    <View style={styles.stationHeader}>
                      <Text style={styles.stationName}>{item.location}</Text>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: status.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.stationAddress}>{item.address}</Text>
                    <View style={styles.statusContainer}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: status.bgColor },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(item.waterAvailable)}
                          size={14}
                          color={status.color}
                        />
                        <Text
                          style={[styles.statusText, { color: status.color }]}
                        >
                          {getStatusText(item.waterAvailable)}
                        </Text>
                      </View>
                      <View style={styles.stationNumberBadge}><Text style={styles.stationtxt}>Station#</Text>
                        <Ionicons name="time" size={14} color="#757575" />
                        <Text style={styles.stationNumberText}>
                          {item.stationNumber}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={{ paddingBottom: 100 }}
          style={{ marginTop: 10 }}
        />
      )}

      {/* Help Modal */}
      <Modal
        visible={helpVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Help</Text>
            <Text style={styles.modalText}>
              This screen shows a searchable map and list of water refill stations in Umlazi.</Text>
              <Text>Tap on any station card to focus on its location on the map.</Text>
              <Text>Markers show the station location.The colored badges indicate water availability status: green means available, red means unavailable.</Text>
              <Text>Use the search bar to filter stations by location name.
            </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
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

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 12,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  helpIcon: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginHorizontal: 15,
    marginBottom: 5,
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
    flex: 1,
    marginHorizontal: 15,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    width: '100%',
    height: 200,
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
    maxHeight: 150,
    zIndex: 10,
  },
  suggestionText: {
    padding: 12,
    fontSize: 16,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
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
  backgroundColor: '#1E90FF', // swapped from #4B39EF
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
  color: '#1E90FF', // swapped from #4B39EF
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
  stationtxt: {
    marginTop: 4,
    fontSize: 13,
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
  color: '#1E90FF', // swapped from #4B39EF
  },
  modalText: {
    fontSize: 16,
    color: '#444',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalCloseButton: {
  backgroundColor: '#1E90FF', // swapped from #4B39EF
  paddingVertical: 12,
  borderRadius: 14,
  },
  modalCloseButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
  },
});
