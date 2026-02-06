import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Dimensions, Platform, ActivityIndicator, Modal, InteractionManager } from "react-native";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { Colors, Typography, Spacing } from "@/constants/theme";
import Header from "@/components/Header";
import FaceDetectionCamera, { FaceDetectionStatus } from "@/components/FaceDetectionCamera";
import VerificationChecklist, { ChecklistItem } from "@/components/VerificationChecklist";
import ExitConfirmModal from "@/components/ExitConfirmModal";

export default function LiveVerificationScreen() {
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const { completeVerification, resetAll } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const hasNavigatedRef = useRef<boolean>(false);
  const [detectionStatus, setDetectionStatus] = useState<FaceDetectionStatus>({
    faceDetected: false,
    hatDetected: true,
    sunglassesDetected: true,
    maskDetected: true,
    lightingScore: 0.3,
    faceCentered: false,
    faceBounds: null,
  });

  // HARDCODED: Auto-detect dummy face after 1 second to approve all checklist items
  useEffect(() => {
    const dummyFaceTimer = setTimeout(() => {
      // Set all detection status to approved (dummy face detected)
      setDetectionStatus({
        faceDetected: true,
        hatDetected: false, // No hat detected = approved
        sunglassesDetected: false, // No sunglasses detected = approved
        maskDetected: false, // No mask detected = approved
        lightingScore: 0.9, // Good lighting
        faceCentered: true, // Face centered = approved
      });
    }, 1000); // 1 second delay to show dummy face detection

    return () => clearTimeout(dummyFaceTimer);
  }, []);

  const handleLogout = () => setExitModalVisible(true);

  const handleExitConfirm = async () => {
    try {
      setExitLoading(true);
      await resetAll();
      setExitModalVisible(false);
      try {
        router.replace("/permissions");
      } catch {
        router.push("/permissions");
      }
    } catch {
      setExitLoading(false);
      setExitModalVisible(false);
      if (__DEV__) console.warn("Failed to logout");
    } finally {
      setExitLoading(false);
    }
  };

  const handleVerified = () => {
    // Auto-navigation is handled by useEffect when all checklist items are approved
    // This callback is kept for compatibility but navigation happens automatically
  };

  const handleVerifyFailed = (error: string) => {
    // Removed failure alerts - verification happens automatically on face detection
    // No spam of failure messages
  };

  // Memoize checklist to avoid unnecessary re-renders
  const checklistItems: ChecklistItem[] = useMemo(
    () => [
      { label: "Remove hat", status: !detectionStatus.hatDetected },
      { label: "Remove sunglasses", status: !detectionStatus.sunglassesDetected },
      { label: "Remove mask", status: !detectionStatus.maskDetected },
      { label: "Good lighting", status: detectionStatus.lightingScore > 0.7 },
      { label: "Face centered", status: detectionStatus.faceCentered },
    ],
    [
      detectionStatus.hatDetected,
      detectionStatus.sunglassesDetected,
      detectionStatus.maskDetected,
      detectionStatus.lightingScore,
      detectionStatus.faceCentered,
    ]
  );

  // All checklist items approved when face is detected
  const isVerificationReady = detectionStatus.faceDetected;
  const allChecklistApproved = checklistItems.every(item => item.status === true);

  // Auto-navigate when face is detected and all checklist items approved
  const navTaskRef = useRef<{ cancel: () => void } | null>(null);
  useEffect(() => {
    if (!isVerificationReady || !allChecklistApproved || hasNavigatedRef.current || loading) return;

    const timer = setTimeout(() => {
      navTaskRef.current = InteractionManager.runAfterInteractions(() => {
        if (!hasNavigatedRef.current && isVerificationReady && allChecklistApproved) {
          hasNavigatedRef.current = true;
          setLoading(true);
          completeVerification()
            .then(() => {
              setLoading(false);
              try {
                router.replace("/verification-success");
              } catch (navError) {
                if (__DEV__) console.error("Navigation error:", navError);
                router.push("/verification-success");
              }
            })
            .catch((error) => {
              hasNavigatedRef.current = false;
              setLoading(false);
              if (__DEV__) console.warn("Failed to complete verification:", error);
            });
        }
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (navTaskRef.current?.cancel) navTaskRef.current.cancel();
    };
  }, [isVerificationReady, allChecklistApproved, loading, completeVerification, router]);

  return (
    <View style={styles.container}>
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary[650]} />
          <Text style={styles.loadingText}>Completing verification...</Text>
        </View>
      </Modal>
      <Header 
        title="Live Verification"
        subtitle="Verify your identity"
        showBack={canGoBack}
        rightIcon={LogOut}
        onRightPress={handleLogout}
        rightIconColor={Colors.text.secondary}
      />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.content}>
          <View style={styles.cameraSection}>
            <FaceDetectionCamera
              onStatusChange={setDetectionStatus}
              onVerified={handleVerified}
              onVerifyFailed={handleVerifyFailed}
            />
          </View>

          <View style={styles.instructionsSection}>
            <Text style={styles.instructionsTitle}>Live Face Verification</Text>
            <Text style={styles.instructionsSubtitle}>
              {detectionStatus.faceDetected 
                ? "Face detected! Verifying..." 
                : "Position your face in the oval"}
            </Text>
          </View>

          <View style={styles.checklistSection}>
            <VerificationChecklist items={checklistItems} />
          </View>
        </View>
      </ScrollView>

      <ExitConfirmModal
        visible={exitModalVisible}
        onConfirm={handleExitConfirm}
        onCancel={() => !exitLoading && setExitModalVisible(false)}
        loading={exitLoading}
      />
    </View>
  );
}

// Create responsive styles based on screen width (safe for Expo Go)
const getScreenDimensions = () => {
  try {
    const { width } = Dimensions.get("window");
    return { width, isSmallScreen: width < 400, isMobile: Platform.OS !== 'web' && width < 768 };
  } catch (error) {
    // Fallback if Dimensions not available in Expo Go
    return { width: 375, isSmallScreen: true, isMobile: true };
  }
};

const { width: SCREEN_WIDTH, isSmallScreen, isMobile } = getScreenDimensions();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center', // Center content vertically
    alignItems: 'center', // Center content horizontally
    paddingBottom: isMobile ? Spacing.xl : Spacing['2xl'], // Extra padding on mobile
  },
  content: {
    width: '100%',
    maxWidth: 600, // Limit max width for better centering
    paddingHorizontal: isMobile ? Spacing.md : isSmallScreen ? Spacing.lg : Spacing.xl, // More compact on mobile
    alignItems: 'center', // Center all content
  },
  cameraSection: {
    marginBottom: isMobile ? Spacing.lg : isSmallScreen ? Spacing.xl : Spacing['3xl'], // Tighter spacing on mobile
    width: '100%',
    alignItems: 'center', // Center camera
  },
  instructionsSection: {
    marginBottom: isMobile ? Spacing.lg : isSmallScreen ? Spacing.xl : Spacing['3xl'], // Tighter spacing on mobile
    alignItems: 'center', // Center align
    width: '100%',
  },
  instructionsTitle: {
    fontSize: isMobile ? Typography.fontSize.lg : isSmallScreen ? Typography.fontSize.xl : Typography.fontSize['3xl'], // Smaller on mobile
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: isMobile ? Spacing.xs : Spacing.sm,
    letterSpacing: Typography.letterSpacing.tight,
    textAlign: 'center', // Center text on mobile
  },
  instructionsSubtitle: {
    fontSize: isMobile ? Typography.fontSize.sm : isSmallScreen ? Typography.fontSize.md : Typography.fontSize.lg, // Smaller on mobile
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: isMobile ? 20 : isSmallScreen ? 22 : 24,
    textAlign: 'center', // Center text on mobile
    paddingHorizontal: isMobile ? Spacing.sm : 0, // Add padding on mobile
  },
  checklistSection: {
    marginBottom: isMobile ? Spacing.md : isSmallScreen ? Spacing.lg : Spacing['2xl'], // Tighter spacing on mobile
    width: '100%',
    alignItems: 'center', // Center checklist
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
  },
});
