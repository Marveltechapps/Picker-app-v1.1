/**
 * useFaceRecognition Hook — Expo Go simple verification.
 * Camera active → verifySuccess() immediately. If faces.length > 0 → verifySuccess().
 * No delay, no conditions, no retries, no failure messages.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { AppState, type AppStateStatus } from 'react-native';
import faceRecognitionService, { type FaceFeature } from '@/services/faceRecognition.service';
import type { FaceDetectionStatus } from '@/types/faceVerification';

export interface UseFaceRecognitionOptions {
  onStatusChange?: (status: FaceDetectionStatus) => void;
  onVerified?: () => void;
  onVerifyFailed?: (error: string) => void;
  /** When false, auto-verify timer does not run (e.g. sheet closed). */
  visible?: boolean;
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
  verify: () => void;
  reset: () => void;
}

/** Camera ready → auto-verify. Reduced for faster UX in Expo Go. */
const CAMERA_READY_VERIFY_MS = 350;

export function useFaceRecognition(options: UseFaceRecognitionOptions = {}): UseFaceRecognitionReturn {
  const { onStatusChange, onVerified, onVerifyFailed, visible = true } = options;

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [status, setStatus] = useState<FaceDetectionStatus>({
    faceDetected: false,
    hatDetected: false,
    sunglassesDetected: false,
    maskDetected: false,
    lightingScore: 0.3,
    faceCentered: false,
    faceBounds: null,
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mounted = useRef(true);
  const verificationTriggered = useRef(false);
  const readyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stableFaceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const STABLE_MS = 600;
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
    return () => {
      mounted.current = false;
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, []);

  const triggerSuccess = useCallback(() => {
    if (!mounted.current || verificationTriggered.current) return;
    verificationTriggered.current = true;
    if (__DEV__) console.log('[useFaceRecognition] Triggering verify');
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
    if (stableFaceTimerRef.current) {
      clearTimeout(stableFaceTimerRef.current);
      stableFaceTimerRef.current = null;
    }
    setIsVerifying(true);
    setError(null);
    const cb = onVerifiedRef.current;
    setTimeout(() => {
      if (!mounted.current) return;
      setIsVerifying(false);
      setIsVerified(true);
      if (cb) cb();
    }, 0);
  }, []);

  /** When face detection is OFF (web/Expo Go): camera ready → verify immediately. When ON: only verify on single-face stable. */
  useEffect(() => {
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
    const faceDetectionOn = faceRecognitionService.isFaceDetectionAvailable();
    if (
      !faceDetectionOn &&
      visible &&
      permission?.granted &&
      !verificationTriggered.current &&
      mounted.current
    ) {
      readyTimerRef.current = setTimeout(() => {
        if (mounted.current && !verificationTriggered.current && permission?.granted) {
          triggerSuccess();
        }
      }, CAMERA_READY_VERIFY_MS);
    }
    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, [visible, permission?.granted, triggerSuccess]);

  /** Single face detected and stable → verify. Update status (including faceBounds) every frame. */
  const handleFacesDetected = useCallback(
    (result: { faces: FaceFeature[]; image?: { width: number; height: number } }) => {
      const imageWidth = result.image?.width ?? 720;
      const imageHeight = result.image?.height ?? 1280;
      const newStatus = faceRecognitionService.processFaceDetection(
        result.faces,
        imageWidth,
        imageHeight
      );
      setStatus(newStatus);
      onStatusChangeRef.current?.(newStatus);

      if (stableFaceTimerRef.current) {
        clearTimeout(stableFaceTimerRef.current);
        stableFaceTimerRef.current = null;
      }
      if (
        faceRecognitionService.shouldVerify(result.faces) &&
        !verificationTriggered.current &&
        mounted.current
      ) {
        stableFaceTimerRef.current = setTimeout(() => {
          if (mounted.current && !verificationTriggered.current) {
            stableFaceTimerRef.current = null;
            triggerSuccess();
          }
        }, STABLE_MS);
      }
    },
    [triggerSuccess]
  );

  /** Manual verify: always succeed (no conditions). */
  const verify = useCallback(() => {
    if (isVerifying || isVerified || verificationTriggered.current) return;
    triggerSuccess();
  }, [isVerifying, isVerified, triggerSuccess]);

  const reset = useCallback(() => {
    verificationTriggered.current = false;
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
    if (stableFaceTimerRef.current) {
      clearTimeout(stableFaceTimerRef.current);
      stableFaceTimerRef.current = null;
    }
    setIsVerified(false);
    setIsVerifying(false);
    setError(null);
    setStatus({
      faceDetected: false,
      hatDetected: false,
      sunglassesDetected: false,
      maskDetected: false,
      lightingScore: 0.3,
      faceCentered: false,
      faceBounds: null,
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

export const getFaceDetectorSettings = () => faceRecognitionService.getFaceDetectorSettings();
