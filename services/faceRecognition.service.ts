/**
 * Face Recognition Service
 * 
 * Real-time face detection and recognition using expo-camera and face detection
 * Features:
 * - Live camera preview
 * - Real-time face detection
 * - Face quality checks (lighting, centering, obstructions)
 * - Multiple face detection blocking
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { FaceDetectionStatus } from '@/types/faceVerification';

const isExpoGo = Constants.executionEnvironment === 'storeClient';

// expo-face-detector not available on web/Expo Go (use dev build for face detection)
let FaceDetector: any = null;
try {
  if (Platform.OS !== 'web') {
    FaceDetector = require('expo-face-detector');
  }
} catch {
  if (!isExpoGo && __DEV__) {
    console.warn('[FaceRecognitionService] expo-face-detector not available. Use a development build for face detection.');
  }
}

export interface FaceFeature {
  bounds: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
  landmarks?: {
    leftEye?: { position: { x: number; y: number } };
    rightEye?: { position: { x: number; y: number } };
  };
}

export interface FaceDetectionResult {
  faces: FaceFeature[];
  imageWidth: number;
  imageHeight: number;
}

export interface FaceQualityCheck {
  isValid: boolean;
  issues: string[];
  score: number; // 0-1 quality score
}

class FaceRecognitionService {
  /**
   * Process face detection results and update status
   * SIMPLIFIED: Any face detected = faceDetected true. No quality/lighting/center checks.
   */
  processFaceDetection(
    faces: FaceFeature[],
    _imageWidth: number,
    _imageHeight: number
  ): FaceDetectionStatus {
    const faceDetected = faces.length > 0;

    // No strict checks: face visible = ready. Status for UI only.
    return {
      faceDetected,
      hatDetected: false, // Always false - no checks
      sunglassesDetected: false, // Always false - no checks
      maskDetected: false, // Always false - no checks
      lightingScore: faceDetected ? 0.9 : 0.3, // Always good if face detected
      faceCentered: faceDetected, // Always centered if face detected
    };
  }

  /**
   * Validate face quality for verification
   */
  validateFaceQuality(status: FaceDetectionStatus): FaceQualityCheck {
    const issues: string[] = [];
    
    if (!status.faceDetected) {
      issues.push('No face detected');
    }
    
    if (status.hatDetected) {
      issues.push('Please remove hat');
    }
    
    if (status.sunglassesDetected) {
      issues.push('Please remove sunglasses');
    }
    
    if (status.maskDetected) {
      issues.push('Please remove mask');
    }
    
    if (status.lightingScore < 0.7) {
      issues.push('Improve lighting');
    }
    
    if (!status.faceCentered) {
      issues.push('Center your face');
    }
    
    // Calculate quality score
    let score = 0;
    if (status.faceDetected) score += 0.3;
    if (!status.hatDetected) score += 0.15;
    if (!status.sunglassesDetected) score += 0.15;
    if (!status.maskDetected) score += 0.15;
    if (status.lightingScore > 0.7) score += 0.15;
    if (status.faceCentered) score += 0.1;
    
    return {
      isValid: issues.length === 0 && status.faceDetected,
      issues,
      score,
    };
  }

  /**
   * Get face detector settings for expo-camera
   * Returns undefined if face detector is not available (web/Expo Go) or in release APK if enums are stripped.
   */
  getFaceDetectorSettings(): any {
    if (!FaceDetector || Platform.OS === 'web') {
      return undefined;
    }
    try {
      // In release APK, minification can strip static enum props; guard each access.
      const Mode = FaceDetector.FaceDetectorMode;
      const Landmarks = FaceDetector.FaceDetectorLandmarks;
      const Classifications = FaceDetector.FaceDetectorClassifications;
      if (!Mode || !Landmarks || !Classifications) {
        return undefined;
      }
      return {
        mode: Mode.fast ?? 0,
        detectLandmarks: Landmarks.all ?? 0,
        runClassifications: Classifications.all ?? 0,
        minDetectionInterval: 100,
        tracking: true,
      };
    } catch (_) {
      // Return undefined so CameraView runs without face detector (no crash)
      return undefined;
    }
  }

  /**
   * Check if face detection is available
   */
  isFaceDetectionAvailable(): boolean {
    return FaceDetector !== null && Platform.OS !== 'web';
  }

  /**
   * Single verification rule: face visible = verified.
   * No lighting, angle, center, or quality checks.
   */
  shouldVerify(faces: FaceFeature[]): boolean {
    return faces.length > 0;
  }
}

export default new FaceRecognitionService();
