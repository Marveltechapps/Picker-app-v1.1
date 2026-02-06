/**
 * useVerifyLocation
 * 
 * Non-blocking location verification hook with automatic fallback.
 * - Attempts real verification first
 * - Falls back to sample/dummy verification if real verification fails
 * - Always resolves (never blocks the user)
 * - Handles web vs native differences
 * - Auto-triggers success callback after verification resolves
 * 
 * CRITICAL: This hook ensures the flow NEVER gets stuck, even if verification fails.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useLocation } from "@/state/locationContext";
import { verifyLocation, safeVerifyLocation, type LocationData } from "@/utils/locationService";

export type VerificationState = "idle" | "verifying" | "resolved" | "failed";

export interface UseVerifyLocationOptions {
  /** Called when verification succeeds (real or fallback) */
  onSuccess: () => void;
  /** Called when verification fails (before fallback) - optional */
  onError?: (error: string) => void;
  /** Enable sample/dummy verification mode */
  enableSampleMode?: boolean;
  /** Timeout for verification attempt (default: 10 seconds) */
  timeoutMs?: number;
}

export interface UseVerifyLocationResult {
  state: VerificationState;
  error: string | null;
  isVerifying: boolean;
  triggerVerification: () => Promise<void>;
}

// Sample verification delay (simulates verification process)
const SAMPLE_VERIFY_DELAY_MS = 2000;
const DEFAULT_TIMEOUT_MS = 10000;

export function useVerifyLocation({
  onSuccess,
  onError,
  enableSampleMode = false,
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: UseVerifyLocationOptions): UseVerifyLocationResult {
  const { currentLocation, locationPermission, requestPermission, refreshLocation, isLoading } = useLocation();
  
  const [state, setState] = useState<VerificationState>("idle");
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent double execution and track state
  const hasTriggeredRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const mountedRef = useRef(true);
  const latestLocationRef = useRef<LocationData | null>(currentLocation);
  
  // Keep location ref updated
  useEffect(() => {
    latestLocationRef.current = currentLocation;
  }, [currentLocation]);

  // Update callback refs
  useEffect(() => {
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [onSuccess, onError]);

  // Track mount state
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      hasTriggeredRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };
  }, []);

  /**
   * Trigger sample/dummy verification
   * Simulates verification success after a delay
   * CRITICAL: This ensures the flow NEVER blocks - always proceeds to next step
   */
  const triggerSampleVerification = useCallback(() => {
    // Clear any existing timeout first
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    if (!mountedRef.current) return;

    console.log("[useVerifyLocation] Using sample verification mode (fallback)");
    setState("verifying");
    setError(null);

    // Simulate verification delay
    fallbackTimerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;

      console.log("[useVerifyLocation] Sample verification success - proceeding to next step");
      setState("resolved");
      hasTriggeredRef.current = true;
      
      // Small delay before calling success to show resolved state
      setTimeout(() => {
        if (mountedRef.current && onSuccessRef.current) {
          onSuccessRef.current();
        }
      }, 500);
    }, SAMPLE_VERIFY_DELAY_MS);
  }, []);

  /**
   * Attempt real location verification
   */
  const attemptRealVerification = useCallback(async (location: LocationData): Promise<boolean> => {
    try {
      // Use safe verification (with relaxed requirements for web)
      const result = safeVerifyLocation(location, Platform.OS === "web");
      
      if (result.isValid) {
        console.log("[useVerifyLocation] Real verification succeeded");
        return true;
      } else {
        console.log("[useVerifyLocation] Real verification failed:", result.reason);
        if (onErrorRef.current) {
          onErrorRef.current(result.reason || "Location verification failed");
        }
        return false;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Verification error";
      console.error("[useVerifyLocation] Verification error:", errorMsg);
      if (onErrorRef.current) {
        onErrorRef.current(errorMsg);
      }
      return false;
    }
  }, []);

  /**
   * Main verification trigger
   */
  const triggerVerification = useCallback(async () => {
    // Prevent double execution
    if (hasTriggeredRef.current || !mountedRef.current) {
      return;
    }

    // Clear any existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    hasTriggeredRef.current = true;
    setState("verifying");
    setError(null);

    // Sample mode: skip real verification
    if (enableSampleMode) {
      triggerSampleVerification();
      return;
    }

    // Real verification flow
    try {
      // Step 1: Ensure permission
      if (locationPermission !== "granted") {
        console.log("[useVerifyLocation] Requesting location permission");
        const hasPermission = await requestPermission();
        
        if (!hasPermission) {
          console.warn("[useVerifyLocation] Permission denied, using fallback");
          // Permission denied - use fallback
          triggerSampleVerification();
          return;
        }
      }

      // Step 2: Always fetch fresh location before verification
      // Verification requires location < 45s old; cached location is often stale, so always refresh.
      console.log("[useVerifyLocation] Fetching fresh location for verification");
      try {
        await refreshLocation();

        // Wait for location state to update (React state updates are async)
        let waitCount = 0;
        const maxWait = 20; // 10 seconds max (20 * 500ms)

        while (!latestLocationRef.current && waitCount < maxWait) {
          await new Promise(resolve => setTimeout(resolve, 500));
          waitCount++;
        }
      } catch (err) {
        console.warn("[useVerifyLocation] Failed to refresh location, using fallback");
        triggerSampleVerification();
        return;
      }

      // Step 3: Use the freshly fetched location from ref
      const location = latestLocationRef.current;
      if (!location) {
        console.warn("[useVerifyLocation] No location available after refresh, using fallback");
        triggerSampleVerification();
        return;
      }

      // Step 4: Attempt real verification
      const verified = await attemptRealVerification(location);

      if (verified) {
        // Real verification succeeded
        if (!mountedRef.current) return;
        
        // Clear timeout since we succeeded
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setState("resolved");
        hasTriggeredRef.current = true;
        
        // Small delay to show success state before navigation
        setTimeout(() => {
          if (mountedRef.current && onSuccessRef.current) {
            onSuccessRef.current();
          }
        }, 500);
      } else {
        // Real verification failed - use fallback (NON-BLOCKING)
        console.log("[useVerifyLocation] Real verification failed, using fallback");
        
        // Clear timeout since we're using fallback
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        triggerSampleVerification();
      }
    } catch (err) {
      // Any error - use fallback
      const errorMsg = err instanceof Error ? err.message : "Verification failed";
      console.error("[useVerifyLocation] Verification error, using fallback:", errorMsg);
      setError(errorMsg);
      triggerSampleVerification();
    }

    // Safety timeout - ensure we always resolve
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current || hasTriggeredRef.current) return;
      
      console.warn("[useVerifyLocation] Verification timeout, using fallback");
      setState("failed");
      triggerSampleVerification();
    }, timeoutMs);
  }, [
    enableSampleMode,
    locationPermission,
    currentLocation,
    isLoading,
    requestPermission,
    refreshLocation,
    attemptRealVerification,
    triggerSampleVerification,
    timeoutMs,
  ]);

  // Reset trigger flag when component unmounts or becomes invisible
  // This ensures the hook can be re-triggered on next mount
  useEffect(() => {
    return () => {
      // Reset trigger flag on unmount to allow re-triggering
      hasTriggeredRef.current = false;
    };
  }, []);

  return {
    state,
    error,
    isVerifying: state === "verifying",
    triggerVerification,
  };
}
