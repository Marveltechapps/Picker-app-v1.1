import React, { useState, useCallback, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import BottomSheetModal from "./BottomSheetModal";
import { Camera, Fingerprint, Shield, ChevronRight } from "lucide-react-native";
import { preloadVerification } from "@/utils/verificationPreload";

interface IdentityVerifySheetProps {
  visible: boolean;
  onSelectMethod: (method: "face" | "fingerprint") => void;
  onClose: () => void;
  onBack: () => void;
}

export default function IdentityVerifySheet({ visible, onSelectMethod, onClose, onBack }: IdentityVerifySheetProps) {
  const [selectedMethod, setSelectedMethod] = useState<"face" | "fingerprint" | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const isSelectingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const handleSelectMethod = useCallback(
    (method: "face" | "fingerprint") => {
      if (isSelectingRef.current) return;
      isSelectingRef.current = true;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsSelecting(true);
      setSelectedMethod(method);
      if (__DEV__) console.log("[IdentityVerify] Method selected:", method);
      onSelectMethod(method);
      setTimeout(() => {
        isSelectingRef.current = false;
        if (mountedRef.current) setIsSelecting(false);
      }, 0);
    },
    [onSelectMethod]
  );

  useEffect(() => {
    if (!visible) {
      isSelectingRef.current = false;
      setIsSelecting(false);
      setSelectedMethod(null);
    } else {
      preloadVerification();
    }
  }, [visible]);

  return (
    <BottomSheetModal 
      visible={visible} 
      onClose={onClose} 
      title="Verify Identity" 
      height="75%" 
      scrollable={true}
      onBack={onBack}
    >
      <View style={styles.container}>
        {/* Section 1: Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "100%" }]} />
          </View>
          <View style={styles.stepLabels}>
            <Text style={styles.stepLabelActive}>Step 2 of 2</Text>
            <Text style={styles.stepLabelActive}>Identity Verification</Text>
          </View>
        </View>

        {/* Section 2: Icon Container */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Shield color="#6366F1" size={30} strokeWidth={2.5} />
          </View>
        </View>

        {/* Section 3: Title and Subtitle */}
        <Text style={styles.title}>Verify Your Identity</Text>
        <Text style={styles.subtitle}>Choose your preferred method</Text>

        {/* Section 4: Methods Container - disabled during transition to prevent double tap */}
        <View style={styles.methodsContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.methodCard,
              styles.methodCardBlue,
              selectedMethod === "face" && styles.methodCardSelected,
              (pressed || isSelecting) && styles.methodCardPressed,
              isSelecting && styles.methodCardDisabled,
            ]}
            onPress={() => handleSelectMethod("face")}
            disabled={isSelecting}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, styles.methodIconBlue]}>
                {isSelecting && selectedMethod === "face" ? (
                  <ActivityIndicator size="small" color="#3B82F6" />
                ) : (
                  <Camera color="#3B82F6" size={28} strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Face Recognition</Text>
                <Text style={styles.methodSubtitle}>
                  {isSelecting && selectedMethod === "face" ? "Opening..." : "Quick and contactless"}
                </Text>
              </View>
            </View>
            <ChevronRight color="#9CA3AF" size={24} strokeWidth={2} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.methodCard,
              styles.methodCardPink,
              selectedMethod === "fingerprint" && styles.methodCardSelected,
              (pressed || isSelecting) && styles.methodCardPressed,
              isSelecting && styles.methodCardDisabled,
            ]}
            onPress={() => handleSelectMethod("fingerprint")}
            disabled={isSelecting}
          >
            <View style={styles.methodLeft}>
              <View style={[styles.methodIcon, styles.methodIconPink]}>
                {isSelecting && selectedMethod === "fingerprint" ? (
                  <ActivityIndicator size="small" color="#EC4899" />
                ) : (
                  <Fingerprint color="#EC4899" size={28} strokeWidth={2.5} />
                )}
              </View>
              <View style={styles.methodInfo}>
                <Text style={styles.methodTitle}>Fingerprint Scan</Text>
                <Text style={styles.methodSubtitle}>
                  {isSelecting && selectedMethod === "fingerprint" ? "Opening..." : "Secure biometric"}
                </Text>
              </View>
            </View>
            <ChevronRight color="#9CA3AF" size={24} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Section 5: Checkbox Container */}
        <View style={styles.checkboxContainer}>
          <View style={styles.checkbox} />
          <Text style={styles.checkboxText}>Remember my choice</Text>
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    alignItems: "center",
    minHeight: "100%",
  },
  stepIndicator: {
    width: "100%",
    marginBottom: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginBottom: 10,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  stepLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stepLabelActive: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#6366F1",
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 6,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  methodsContainer: {
    width: "100%",
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    marginBottom: 12,
  },
  methodCardBlue: {
    backgroundColor: "#EFF6FF",
    borderColor: "#DBEAFE",
  },
  methodCardPink: {
    backgroundColor: "#FCE7F3",
    borderColor: "#FBCFE8",
  },
  methodCardSelected: {
    borderColor: "#6366F1",
  },
  methodCardPressed: {
    opacity: Platform.OS === "web" ? 0.8 : 0.7,
    transform: Platform.OS === "web" ? [{ scale: 0.98 }] : [],
  },
  methodCardDisabled: {
    opacity: 0.7,
    pointerEvents: "none",
  },
  methodLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  methodIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  methodIconBlue: {
    backgroundColor: "#DBEAFE",
  },
  methodIconPink: {
    backgroundColor: "#FBCFE8",
  },
  methodInfo: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#111827",
  },
  methodSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
    marginTop: 4,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    width: "100%",
    justifyContent: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
});
