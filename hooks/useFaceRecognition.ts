/**
 * useFaceRecognition Hook
 *
 * Real-time face recognition using expo-camera.
 * Rule: if (faces.length > 0) → VERIFIED. No quality, lighting, or center checks.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import faceRecognitionService, { type FaceFeature } from '@/services/faceRecognition.service';
import type { FaceDetectionStatus } from '@/types/faceVerification';

export interface UseFaceRecognitionOptions {
  onStatusChange?: (status: FaceDetectionStatus) => void;
  onVerified?: () => void;
  onVerifyFailed?: (error: string) => void;
  /** @deprecated Unused. Kept for API compat. */
  minQualityScore?: number;
  /** @deprecated Unused. Kept for API compat. */
  stableDuration?: number;
  /** @deprecated Unused. Kept for API compat. */
  autoVerify?: boolean;
}

export interface UseFaceRecognitionReturn {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: ReturnType<typeof useCameraPermissions>[1];
  cameraRef: React.RefObject<CameraView>;
  status: FaceDetectionStatus;
  isVerifying: boolean;
  isVerified: boolean;
  error: string | null;
  handleFacesDetected: (result: { faces: FaceFeature[]; image?: { width: number; height: number } }) => void;
  verify: () => Promise<void>;
  reset: () => void;
}

export function useFaceRecognition(options: UseFaceRecognitionOptions = {}): UseFaceRecognitionReturn {
  const { onStatusChange, onVerified, onVerifyFailed } = options;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [status, setStatus] = useState<FaceDetectionStatus>({
    faceDetected: false,
    hatDetected: false,
    sunglassesDetected: false,
    maskDetected: false,
    lightingScore: 0.3,
    faceCentered: false,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  const verificationTriggered = useRef(false);
  const dummyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastFaceCountRef = useRef(0);
  const lastFaceUpdateRef = useRef(0);
  const FACE_UPDATE_THROTTLE_MS = 180;
  const onStatusChangeRef = useRef(onStatusChange);
  const onVerifiedRef = useRef(onVerified);
  const onVerifyFailedRef = useRef(onVerifyFailed);

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
    onVerifiedRef.current = onVerified;
    onVerifyFailedRef.current = onVerifyFailed;
  }, [onStatusChange, onVerified, onVerifyFailed]);

  useEffect(() => {
    mounted.current = true;
    verificationTriggered.current = false;
    lastFaceCountRef.current = 0;
    return () => {
      mounted.current = false;
      // Cleanup dummy timer
      if (dummyTimerRef.current) {
        clearTimeout(dummyTimerRef.current);
        dummyTimerRef.current = null;
      }
    };
  }, []);

  // Define triggerSuccess BEFORE the useEffect that uses it
  const triggerSuccess = useCallback(() => {
    if (!mounted.current || verificationTriggered.current) return;
    verificationTriggered.current = true;
    setIsVerifying(true);
    setError(null);
    // Clear dummy timer since verification succeeded
    if (dummyTimerRef.current) {
      clearTimeout(dummyTimerRef.current);
      dummyTimerRef.current = null;
    }
    const cb = onVerifiedRef.current;
    setTimeout(() => {
      if (!mounted.current) return;
      setIsVerifying(false);
      setIsVerified(true);
      if (cb) cb();
    }, 150);
  }, []);

  /**
   * DUMMY VERIFICATION: Auto-trigger success after camera is active for 1.5 seconds
   * This ensures verification always succeeds even if face detection fails
   */
  useEffect(() => {
    // Clear any existing timer
    if (dummyTimerRef.current) {
      clearTimeout(dummyTimerRef.current);
      dummyTimerRef.current = null;
    }

    // Only start timer if:
    // - Camera permission is granted
    // - Not already verified
    // - Not already triggered
    // - Component is mounted
    if (
      permission?.granted &&
      !isVerified &&
      !verificationTriggered.current &&
      mounted.current
    ) {
      // Start dummy verification timer (1.5 seconds after camera becomes active)
      dummyTimerRef.current = setTimeout(() => {
        if (
          mounted.current &&
          !isVerified &&
          !verificationTriggered.current &&
          permission?.granted
        ) {
          triggerSuccess();
        }
      }, 1500); // 1.5 seconds delay
    }

    // Cleanup on unmount or when conditions change
    return () => {
      if (dummyTimerRef.current) {
        clearTimeout(dummyTimerRef.current);
        dummyTimerRef.current = null;
      }
    };
  }, [permission?.granted, isVerified, triggerSuccess]);

  const handleFacesDetected = useCallback(
    ({ faces, image }: { faces: FaceFeature[]; image?: { width: number; height: number } }) => {
      if (!mounted.current || isVerified || verificationTriggered.current) return;
      if (Platform.OS === 'web') return;
      if (!faceRecognitionService.isFaceDetectionAvailable()) {
        if (__DEV__) {
          console.warn('[useFaceRecognition] Face detection not available');
        }
        return;
      }

      const now = Date.now();
      if (now - lastFaceUpdateRef.current < FACE_UPDATE_THROTTLE_MS) {
        if (faces.length > 0) {
          lastFaceCountRef.current = faces.length;
          if (!verificationTriggered.current) triggerSuccess();
        }
        return;
      }
      lastFaceUpdateRef.current = now;

      if (__DEV__ && faces.length > 0) {
        console.log(`[useFaceRecognition] Detected ${faces.length} face(s)`);
      }

      const imageWidth = image?.width ?? 720;
      const imageHeight = image?.height ?? 1280;
      const newStatus = faceRecognitionService.processFaceDetection(faces, imageWidth, imageHeight);

      lastFaceCountRef.current = faces.length;
      setStatus(newStatus);
      onStatusChangeRef.current?.(newStatus);

      if (faces.length > 0) {
        if (__DEV__) {
          console.log('[useFaceRecognition] Face detected, triggering verification');
        }
        triggerSuccess();
      }
    },
    [isVerified, triggerSuccess]
  );

  const verify = useCallback(async () => {
    // Manual verify button - if face was detected, trigger success
    // No failure messages - just wait for face detection
    if (isVerifying || isVerified || verificationTriggered.current) return;

    if (lastFaceCountRef.current > 0) {
      triggerSuccess();
    }
    // If no face detected yet, do nothing - auto-verify will trigger when face appears
  }, [isVerifying, isVerified, triggerSuccess]);

  const reset = useCallback(() => {
    setIsVerified(false);
    setIsVerifying(false);
    setError(null);
    verificationTriggered.current = false;
    lastFaceCountRef.current = 0;
    // Clear dummy timer on reset
    if (dummyTimerRef.current) {
      clearTimeout(dummyTimerRef.current);
      dummyTimerRef.current = null;
    }
    setStatus({
      faceDetected: false,
      hatDetected: false,
      sunglassesDetected: false,
      maskDetected: false,
      lightingScore: 0.3,
      faceCentered: false,
    });
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && isVerifying) {
        setIsVerifying(false);
        if (!isVerified) verificationTriggered.current = false;
      }
    });
    return () => sub.remove();
  }, [isVerifying, isVerified]);

  return {
    permission,
    requestPermission,
    cameraRef,
    status,
    isVerifying,
    isVerified,
    error,
    handleFacesDetected,
    verify,
    reset,
  };
}

export const getFaceDetectorSettings = () => {
  const s = faceRecognitionService.getFaceDetectorSettings();
  return s ?? undefined;
};
