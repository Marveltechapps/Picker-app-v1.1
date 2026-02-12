/**
 * Auth Service
 *
 * Handles send OTP, resend OTP, and verify OTP per backend-workflow.yaml
 * (auth_send_otp, auth_resend_otp, auth_verify_otp).
 */

import { apiPost, ApiClientError } from "@/utils/apiClient";

export interface SendOtpResponse {
  success: boolean;
  message?: string;
  /** Set when success is false (from API error or validation) */
  error?: string;
  /** Present only in dev mode – use for testing verify flow */
  debugOtp?: string;
  otp?: string;
}

export interface VerifyOtpResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: { phone: string; id: string };
  /** Set when success is false */
  error?: string;
}

/**
 * Normalize to 10-digit: digits only; strip leading 91 or 0.
 * Same logic as backend so "6556734235", "916556734235", "06556734235" all work.
 */
function normalizePhone(phone: string): string {
  const digits = (phone ?? "").toString().replace(/\D/g, "");
  if (digits.length === 10 && /^[5-9]/.test(digits)) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * POST /auth/send-otp – send OTP to phone
 * Body: { phone: string } – 10 digits (e.g. 6556734235)
 */
export async function sendOtp(phone: string): Promise<SendOtpResponse> {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10 || !/^[5-9]/.test(normalized)) {
    return { success: false, error: "Invalid phone number format. Enter a valid 10-digit mobile number (e.g. 6556734235)." };
  }
  if (__DEV__) console.log("[auth.service] sendOtp BEFORE – phone:", normalized, "body: { phone }");
  try {
    const response = await apiPost<SendOtpResponse & { otp?: string }>("/auth/send-otp", { phone: normalized });
    if (__DEV__) console.log("[auth.service] sendOtp AFTER – success:", response.success, "debugOtp:", response.debugOtp ?? response.otp);
    // Backend dev mode returns otp; normalize so debugOtp is set for OTP screen
    const debugOtp = response.debugOtp ?? response.otp;
    return debugOtp !== undefined ? { ...response, debugOtp } : response;
  } catch (error) {
    const err = error instanceof ApiClientError ? error : null;
    if (__DEV__) console.log("[auth.service] sendOtp ERROR – message:", err?.message ?? (error as Error)?.message, "status:", err?.status, "details:", err?.details);
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * POST /auth/resend-otp – resend OTP to phone (e.g. for Resend button on OTP screen).
 * Body: { phone: string } – 10 digits. Backend may apply resend-specific rate limits.
 */
export async function resendOtp(phone: string): Promise<SendOtpResponse> {
  const normalized = normalizePhone(phone);
  if (normalized.length !== 10 || !/^[5-9]/.test(normalized)) {
    return { success: false, error: "Invalid phone number format. Enter a valid 10-digit mobile number." };
  }
  if (__DEV__) console.log("[auth.service] resendOtp BEFORE – phone:", normalized);
  try {
    const response = await apiPost<SendOtpResponse>("/auth/resend-otp", { phone: normalized });
    if (__DEV__) console.log("[auth.service] resendOtp AFTER – success:", response.success);
    return response;
  } catch (error) {
    const err = error instanceof ApiClientError ? error : null;
    if (__DEV__) console.log("[auth.service] resendOtp ERROR – message:", err?.message ?? (error as Error)?.message);
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}

/**
 * POST /auth/verify-otp – verify OTP and get JWT
 * Body: { phone: string, otp: string }
 */
export async function verifyOtp(phone: string, otp: string): Promise<VerifyOtpResponse> {
  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length !== 10 || !/^[5-9]/.test(normalizedPhone)) {
    return { success: false, error: "Enter a valid 10-digit mobile number." };
  }
  const otpTrimmed = (otp ?? "").toString().trim();
  if (__DEV__) console.log("[auth.service] verifyOtp BEFORE – phone:", normalizedPhone, "body: { phone, otp }");
  try {
    const response = await apiPost<VerifyOtpResponse>("/auth/verify-otp", {
      phone: normalizedPhone,
      otp: otpTrimmed,
    });
    if (__DEV__) console.log("[auth.service] verifyOtp AFTER – success:", response.success, "hasToken:", !!response.token);
    return response;
  } catch (error) {
    const err = error instanceof ApiClientError ? error : null;
    if (__DEV__) console.log("[auth.service] verifyOtp ERROR – message:", err?.message ?? (error as Error)?.message);
    if (error instanceof ApiClientError) {
      return { success: false, error: error.message };
    }
    throw error;
  }
}
