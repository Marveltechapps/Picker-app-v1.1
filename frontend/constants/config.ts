/**
 * App config – API base URL and shared constants.
 *
 * Expo Go on physical device: set EXPO_PUBLIC_API_URL in .env to your machine's
 * IPv4 (e.g. http://192.168.1.100:3000). localhost/127.0.0.1 on device refers to
 * the device itself, not your dev machine, and causes "Network request failed".
 */

const PLACEHOLDER_API = "https://api.example.com";
const BACKEND_PORT = "3000";

/** Treat env value as "unset" if it's a placeholder (invalid host). */
function isPlaceholderUrl(url: string): boolean {
  if (!url || !url.trim()) return true;
  const lower = url.trim().toLowerCase();
  if (lower === PLACEHOLDER_API.toLowerCase()) return true;
  if (lower.includes("your_ip") || lower.includes("your_ipv4")) return true;
  if (lower.includes("example.com")) return true;
  return false;
}

function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && !isPlaceholderUrl(envUrl)) return envUrl;
  // Web: use same host as the page so API is reachable
  if (typeof window !== "undefined" && window?.location?.hostname) {
    const protocol = window.location.protocol || "http:";
    const host = window.location.hostname;
    return `${protocol}//${host}:${BACKEND_PORT}`;
  }
  // Native (Expo Go must set EXPO_PUBLIC_API_URL to computer's IPv4)
  return "http://127.0.0.1:3000";
}

/** Base URL for API (no trailing slash). Use this for all backend requests. */
export const API_BASE_URL = getApiBaseUrl();

if (typeof __DEV__ !== "undefined" && __DEV__) {
  console.log("[config] API_BASE_URL:", API_BASE_URL);
}
