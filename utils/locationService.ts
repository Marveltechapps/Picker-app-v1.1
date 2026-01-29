import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

/** Timeout for getCurrentPositionAsync (expo-location has no built-in timeout). */
// Increased timeout to 30 seconds for better GPS acquisition, especially in Expo Go
export const LOCATION_TIMEOUT_MS = 30000;

/** In-memory cache for last known location + address (avoids redundant fetches). */
let cachedLocation: LocationData | null = null;
let cachedAddress: LocationAddress | null = null;
let cacheTimestamp = 0;
const CACHE_MAX_AGE_MS = 60_000; // 1 minute

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  heading: number | null;
  speed: number | null;
  timestamp: number;
}

export interface LocationAddress {
  street?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country?: string;
  formattedAddress?: string;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable';

function withTimeout<T>(promise: Promise<T>, ms: number, message = 'Operation timed out'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

/**
 * Return cached location if still fresh.
 */
export function getCachedLocation(): { location: LocationData; address: LocationAddress | null } | null {
  if (!cachedLocation) return null;
  if (Date.now() - cacheTimestamp > CACHE_MAX_AGE_MS) return null;
  return { location: cachedLocation, address: cachedAddress };
}

/**
 * Set cached location (used after successful fetch + optional geocode).
 */
export function setCachedLocation(location: LocationData, address: LocationAddress | null): void {
  cachedLocation = location;
  cachedAddress = address;
  cacheTimestamp = Date.now();
}

/**
 * Check current location permission status
 */
export async function checkLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else if (status === 'undetermined') {
      return 'unavailable';
    } else {
      return 'blocked';
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking location permission:', error);
    }
    return 'unavailable';
  }
}

/**
 * Request foreground location permission
 */
export async function requestLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else {
      return 'blocked';
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error requesting location permission:', error);
    }
    return 'unavailable';
  }
}

/**
 * Check background location permission status
 */
export async function checkBackgroundLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.getBackgroundPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else if (status === 'undetermined') {
      return 'unavailable';
    } else {
      return 'blocked';
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking background location permission:', error);
    }
    return 'unavailable';
  }
}

/**
 * Request background location permission
 */
export async function requestBackgroundLocationPermission(): Promise<LocationPermissionStatus> {
  try {
    const { status } = await Location.requestBackgroundPermissionsAsync();
    
    if (status === 'granted') {
      return 'granted';
    } else if (status === 'denied') {
      return 'denied';
    } else {
      return 'blocked';
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error requesting background location permission:', error);
    }
    return 'unavailable';
  }
}

/**
 * Get current device location with timeout and optional cache.
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  try {
    const permissionStatus = await checkLocationPermission();

    if (permissionStatus !== 'granted') {
      if (__DEV__) {
        console.warn('Location permission not granted');
      }
      return null;
    }

    if (Platform.OS !== 'web') {
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return null;
      }
    }

    // Check for cached location first (if available and recent)
    const cached = getCachedLocation();
    if (cached && cached.location) {
      const age = Date.now() - cached.location.timestamp;
      // Use cached location if less than 10 seconds old
      if (age < 10000) {
        return cached.location;
      }
    }

    const fetchPromise = Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      // Use lower accuracy for faster acquisition in Expo Go
      ...(Platform.OS === 'web' ? {} : { mayShowUserSettingsDialog: true }),
    }).then((location) => ({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
      timestamp: location.timestamp,
    }));

    const location = await withTimeout(
      fetchPromise,
      LOCATION_TIMEOUT_MS,
      'Location request timed out. Please ensure GPS is enabled and try again.'
    );

    return location;
  } catch (error) {
    // Handle timeout errors gracefully - don't log as error, just as warning
    const isTimeoutError = error instanceof Error && 
      error.message.includes('timed out');
    
    if (isTimeoutError) {
      // Try to return cached location if timeout occurs
      const cached = getCachedLocation();
      if (cached && cached.location) {
        if (__DEV__) {
          console.warn('Location request timed out, using cached location');
        }
        return cached.location;
      }
      
      // Only log timeout as warning in dev mode, not as error
      if (__DEV__) {
        console.warn('Location request timed out. GPS may be slow or unavailable.');
      }
    } else {
      // Log other errors only in dev mode
      if (__DEV__) {
        console.error('Error getting current location:', error);
      }
    }
    return null;
  }
}

/**
 * Reverse geocode on web.
 * Nominatim does not allow direct browser requests (CORS + 403), so we return a
 * fallback address from coordinates to avoid console errors and failed fetches.
 */
async function reverseGeocodeWeb(lat: number, lon: number): Promise<LocationAddress | null> {
  // Return fallback immediately on web: Nominatim blocks browser requests (CORS, 403).
  // This avoids "Access to fetch blocked by CORS" and "403 Forbidden" console errors.
  const formattedAddress = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  return {
    formattedAddress,
    city: undefined,
    region: undefined,
    postalCode: undefined,
    country: undefined,
    street: undefined,
  };
}

/**
 * Reverse geocode coordinates to human-readable address.
 * Uses expo-location on native; on web returns coordinates fallback (Nominatim blocks browser CORS).
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationAddress | null> {
  if (Platform.OS === 'web') {
    return reverseGeocodeWeb(latitude, longitude);
  }

  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    if (addresses && addresses.length > 0) {
      const address = addresses[0];

      const street =
        address.street || address.streetNumber
          ? `${address.streetNumber || ''} ${address.street || ''}`.trim()
          : address.district ?? undefined;

      const city = address.city ?? address.subregion ?? address.district;
      const region = address.region;

      return {
        street,
        city: city ?? undefined,
        region: region ?? undefined,
        postalCode: address.postalCode ?? undefined,
        country: address.country ?? undefined,
        formattedAddress: formatAddress(address),
      };
    }

    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('Error reverse geocoding:', error);
    }
    return null;
  }
}

/**
 * Format address object to readable string (Area, City, State format)
 */
function formatAddress(address: Location.LocationGeocodedAddress): string {
  const parts: string[] = [];

  if (address.district) parts.push(address.district);
  if (parts.length === 0 && (address.streetNumber || address.street)) {
    parts.push(`${address.streetNumber || ''} ${address.street || ''}`.trim());
  }

  if (address.city) parts.push(address.city);
  else if (address.subregion) parts.push(address.subregion);
  else if (address.district && parts.length > 0) parts.push(address.district);

  if (address.region) parts.push(address.region);

  // Priority 5: Country (only if we don't have enough info)
  if (parts.length === 0 && address.country) {
    parts.push(address.country);
  }

  return parts.filter(Boolean).join(', ') || 'Unknown Location';
}

/**
 * Fallback when reverse geocode fails: "Lat, Lng" (e.g. "13.0825°, 80.2750°").
 */
export function formatCoordsFallback(lat: number, lon: number): string {
  return `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
}

/**
 * Calculate distance between two coordinates in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Format accuracy value for display
 */
export function formatAccuracy(accuracy: number | null): string {
  if (accuracy === null) {
    return 'N/A';
  }

  if (accuracy < 1000) {
    return `±${Math.round(accuracy)}m`;
  } else {
    return `±${(accuracy / 1000).toFixed(1)}km`;
  }
}

/**
 * Verify if a location is valid for verification
 * Checks accuracy, coordinates validity, and timestamp freshness
 * 
 * NOTE: This is the STRICT verification function.
 * Use safeVerifyLocation() for more lenient verification with fallback support.
 */
export function verifyLocation(location: LocationData | null): {
  isValid: boolean;
  reason?: string;
} {
  if (!location) {
    return { isValid: false, reason: 'No location data available' };
  }

  // Check if coordinates are valid
  if (
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number' ||
    isNaN(location.latitude) ||
    isNaN(location.longitude)
  ) {
    return { isValid: false, reason: 'Invalid coordinates' };
  }

  // Check if coordinates are within valid range
  if (
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return { isValid: false, reason: 'Coordinates out of valid range' };
  }

  // Check accuracy (should be reasonable for verification)
  // Accept accuracy up to 100 meters (0.1km) for verification
  if (location.accuracy !== null && location.accuracy > 100) {
    return { isValid: false, reason: 'Location accuracy too low' };
  }

  // Check timestamp freshness (location should be recent, within last 30 seconds)
  const age = Date.now() - location.timestamp;
  if (age > 30000) {
    return { isValid: false, reason: 'Location data is too old' };
  }

  return { isValid: true };
}

/**
 * Safe location verification with relaxed requirements for web/fallback scenarios.
 * 
 * This function is more lenient than verifyLocation():
 * - Allows lower accuracy (up to 500m for web, 200m for native)
 * - Allows older timestamps (up to 60 seconds)
 * - Designed to work better across different environments
 * 
 * Use this when you want verification to succeed more often, especially on web.
 */
export function safeVerifyLocation(
  location: LocationData | null,
  isWeb: boolean = false
): {
  isValid: boolean;
  reason?: string;
} {
  if (!location) {
    return { isValid: false, reason: 'No location data available' };
  }

  // Check if coordinates are valid
  if (
    typeof location.latitude !== 'number' ||
    typeof location.longitude !== 'number' ||
    isNaN(location.latitude) ||
    isNaN(location.longitude)
  ) {
    return { isValid: false, reason: 'Invalid coordinates' };
  }

  // Check if coordinates are within valid range
  if (
    location.latitude < -90 ||
    location.latitude > 90 ||
    location.longitude < -180 ||
    location.longitude > 180
  ) {
    return { isValid: false, reason: 'Coordinates out of valid range' };
  }

  // Relaxed accuracy check (web is less accurate, so be more lenient)
  const maxAccuracy = isWeb ? 500 : 200; // 500m for web, 200m for native
  if (location.accuracy !== null && location.accuracy > maxAccuracy) {
    return { isValid: false, reason: `Location accuracy too low (${Math.round(location.accuracy)}m > ${maxAccuracy}m)` };
  }

  // Relaxed timestamp check (allow up to 60 seconds for web, 45 seconds for native)
  const maxAge = isWeb ? 60000 : 45000;
  const age = Date.now() - location.timestamp;
  if (age > maxAge) {
    return { isValid: false, reason: `Location data is too old (${Math.round(age / 1000)}s > ${maxAge / 1000}s)` };
  }

  return { isValid: true };
}
