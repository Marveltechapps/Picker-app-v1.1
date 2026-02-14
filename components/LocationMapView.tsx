import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useLocation } from '@/state/locationContext';
import { isExpoGo } from '@/utils/expoGoDetection';

// Lazy-load MapView only when needed; NEVER load in Expo Go (crashes) or web
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;
let PROVIDER_DEFAULT: any = null;
let mapsLoaded = false;

function tryLoadMaps(): boolean {
  if (Platform.OS === 'web' || isExpoGo()) return false;
  if (mapsLoaded) return !!MapView;
  mapsLoaded = true;
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker;
    PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
    PROVIDER_DEFAULT = Maps.PROVIDER_DEFAULT;
    return !!MapView;
  } catch {
    return false;
  }
}

export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface LocationMapViewProps {
  style?: any;
  showUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  onRegionChangeComplete?: (region: Region) => void;
}

export default function LocationMapView({
  style,
  showUserLocation = true,
  showsMyLocationButton = false,
  showsCompass = false,
  onRegionChangeComplete,
}: LocationMapViewProps) {
  const { currentLocation, locationPermission } = useLocation();
  const mapRef = useRef<MapView>(null);

  // Update map region when location changes (only on native platforms)
  useEffect(() => {
    if (Platform.OS === 'web') return;
    
    if (currentLocation && mapRef.current) {
      try {
        const region: Region = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          latitudeDelta: 0.01, // Zoom level
          longitudeDelta: 0.01,
        };

        mapRef.current.animateToRegion(region, 1000);
      } catch (err) {
        // Silently handle map animation errors
        console.warn('Error animating map to region:', err);
      }
    }
  }, [currentLocation]);

  // Initial region (fallback to a default location if no current location)
  const initialRegion: Region = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        // Default to a central location (can be adjusted)
        latitude: 12.9716, // Bangalore coordinates as fallback
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  // On web, Expo Go, or if MapView failed to load: show placeholder
  const mapsAvailable = tryLoadMaps();
  if (Platform.OS === 'web' || !mapsAvailable || !MapView) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.webPlaceholder} />
      </View>
    );
  }

  // Use PROVIDER_DEFAULT to avoid PROVIDER_GOOGLE crashes in Expo Go / simulators
  const mapProvider = PROVIDER_DEFAULT;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={mapProvider}
        initialRegion={initialRegion}
        showsUserLocation={showUserLocation && locationPermission === 'granted'}
        showsMyLocationButton={showsMyLocationButton}
        showsCompass={showsCompass}
        onRegionChangeComplete={onRegionChangeComplete}
        mapType="standard"
        loadingEnabled={true}
      >
        {currentLocation && Marker && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${currentLocation.accuracy ? `±${Math.round(currentLocation.accuracy)}m` : 'N/A'}`}
            pinColor="#6366F1"
          />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  webPlaceholder: {
    flex: 1,
    backgroundColor: '#E5E7EB',
  },
});
