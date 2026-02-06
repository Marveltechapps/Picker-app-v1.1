/**
 * Location service: permission, current position, reverse geocoding.
 * Delegates to utils/locationService; provides a single API for app usage.
 */

import {
  type LocationData,
  type LocationAddress,
  type LocationPermissionStatus,
  checkLocationPermission,
  requestLocationPermission,
  getCurrentLocation as getCurrentLocationUtil,
  reverseGeocode as reverseGeocodeUtil,
  getCachedLocation,
  setCachedLocation,
} from '@/utils/locationService';

export type { LocationData, LocationAddress, LocationPermissionStatus };

/**
 * Request foreground location permission (Android + iOS).
 */
export async function requestPermission(): Promise<LocationPermissionStatus> {
  return requestLocationPermission();
}

/**
 * Get current device location (real GPS). Uses timeout + cache.
 */
export async function getCurrentLocation(): Promise<LocationData | null> {
  const cached = getCachedLocation();
  if (cached) {
    return cached.location;
  }
  const location = await getCurrentLocationUtil();
  if (location) {
    setCachedLocation(location, null);
  }
  return location;
}

/**
 * Reverse geocode lat/lng to human-readable address (Area, City, State).
 * Uses expo-location on native; Nominatim on web.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<LocationAddress | null> {
  return reverseGeocodeUtil(lat, lng);
}
