/**
 * API Client Utility
 *
 * Centralized HTTP client with authentication, error handling, and request/response interceptors.
 * Uses fetch API (React Native compatible).
 *
 * Expo Go (mobile): Set EXPO_PUBLIC_API_URL in .env to your machine's LAN IP (e.g. http://192.168.1.100:3000).
 * localhost on device refers to the device itself, not your dev machine.
 */

import { API_BASE_URL } from "@/constants/config";

const DEFAULT_BASE_URL = API_BASE_URL;

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
}

export class ApiClientError extends Error {
  code?: string;
  status?: number;
  details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Get auth token from storage (exported so screens can skip auth-only API calls when not logged in).
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    const AsyncStorage = await import("@react-native-async-storage/async-storage");
    return await AsyncStorage.default.getItem("@auth/token");
  } catch {
    return null;
  }
}

/**
 * API Client with automatic auth and error handling
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}${endpoint}`;
  if (__DEV__) console.log("[apiClient] Request URL:", url);

  // Get auth token
  const token = await getAuthToken();
  
  // Prepare headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get("content-type");
    const isJson = contentType?.includes("application/json");

    let data: unknown;
    if (isJson) {
      data = await response.json().catch(() => ({}));
    } else {
      data = await response.text().catch(() => "");
    }

    if (!response.ok) {
      const errorData = data as { message?: string; error?: string; code?: string; details?: unknown };
      if (__DEV__) console.log("[apiClient] Error response:", response.status, errorData);
      throw new ApiClientError(
        errorData.message || errorData.error || `HTTP ${response.status}`,
        response.status,
        errorData.code,
        errorData.details
      );
    }

    if (__DEV__) console.log("[apiClient] Success:", url);
    return data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      if (__DEV__) console.log("[apiClient] ApiClientError:", error.message, error.status, error.details);
      throw error;
    }

    const rawMessage = error instanceof Error ? error.message : "Network request failed";
    const isFetchFailure =
      rawMessage === "Failed to fetch" ||
      rawMessage === "Network request failed" ||
      /network error|load failed/i.test(rawMessage);

    const baseUrlForHint = DEFAULT_BASE_URL;
    const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(baseUrlForHint);
    const isNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";

    let hint = "";
    if (isFetchFailure) {
      if (isNative) {
        hint =
          " Set EXPO_PUBLIC_API_URL in .env to your computer's IP (e.g. http://192.168.1.x:3000), ensure the backend is running, and restart the app.";
      } else {
        hint =
          " Ensure the backend is running on port 3000 (same host as this page). If the API is elsewhere, set EXPO_PUBLIC_API_URL.";
      }
    }

    const errMessage = isFetchFailure ? "Network request failed" + hint : rawMessage;
    if (__DEV__) console.log("[apiClient] Network error:", rawMessage, "url:", url);
    throw new ApiClientError(errMessage, 0, "NETWORK_ERROR");
  }
}

/**
 * GET request helper
 */
export async function apiGet<T = unknown>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: "GET" });
}

/**
 * POST request helper
 */
export async function apiPost<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * POST multipart/form-data (e.g. file upload). Do not set Content-Type so fetch sets boundary.
 */
export async function apiPostFormData<T = unknown>(endpoint: string, formData: FormData): Promise<T> {
  const baseUrl = DEFAULT_BASE_URL.replace(/\/$/, "");
  const url = `${baseUrl}${endpoint}`;
  if (__DEV__) console.log("[apiClient] POST (form) URL:", url);
  const token = await getAuthToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const data = isJson ? await response.json().catch(() => ({})) : await response.text().catch(() => "");
  if (!response.ok) {
    const err = data as { message?: string; error?: string };
    throw new ApiClientError(err.message || err.error || `HTTP ${response.status}`, response.status);
  }
  return data as T;
}

/**
 * PUT request helper
 */
export async function apiPut<T = unknown>(endpoint: string, body?: unknown): Promise<T> {
  return apiClient<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = unknown>(endpoint: string): Promise<T> {
  return apiClient<T>(endpoint, { method: "DELETE" });
}
