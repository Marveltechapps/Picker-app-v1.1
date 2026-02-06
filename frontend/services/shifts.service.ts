/**
 * Shifts Service
 *
 * Handles shifts per backend-workflow.yaml
 * (shifts_available, shifts_select, shift_start, shift_end).
 */

import { apiGet, apiPost, getAuthToken, ApiClientError } from "@/utils/apiClient";

export interface ShiftItem {
  id: string;
  name: string;
  time: string;
  duration?: string;
  orders?: number;
  basePay?: number;
  color?: string;
  limitedSpots?: boolean;
  locationType?: string;
}

export interface ShiftSelection {
  id: string;
  name: string;
  time: string;
}

interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

/**
 * GET /shifts/available – return available shifts
 */
export async function getAvailableShifts(): Promise<ShiftItem[]> {
  try {
    const res = await apiGet<ApiDataResponse<ShiftItem[]>>("/shifts/available");
    return (res as ApiDataResponse<ShiftItem[]>).data ?? [];
  } catch (error) {
    if (error instanceof ApiClientError) return [];
    throw error;
  }
}

/**
 * POST /shifts/select – persist selected shifts.
 * If user is not logged in (no token), skips API and returns success so flow can continue without 401.
 */
export async function selectShiftsApi(
  selectedShifts: ShiftSelection[]
): Promise<{ success: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) {
    return { success: true };
  }
  try {
    await apiPost<{ success: boolean }>("/shifts/select", { selectedShifts });
    return { success: true };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * POST /shifts/start – punch in (optional body: location, shiftId)
 */
export async function startShiftApi(body?: {
  location?: unknown;
  shiftId?: string;
}): Promise<{ success: boolean; shiftStartTime?: number; error?: string }> {
  try {
    const res = await apiPost<ApiDataResponse<{ shiftStartTime?: number }>>(
      "/shifts/start",
      body ?? {}
    );
    const data = (res as ApiDataResponse<{ shiftStartTime?: number }>).data;
    return { success: true, shiftStartTime: data?.shiftStartTime };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * POST /shifts/end – punch out
 */
export async function endShiftApi(): Promise<{ success: boolean; error?: string }> {
  try {
    await apiPost<{ success: boolean }>("/shifts/end", {});
    return { success: true };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
