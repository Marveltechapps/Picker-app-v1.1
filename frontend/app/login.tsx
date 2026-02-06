import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { sendOtp } from "@/services/auth.service";
import { Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useColors } from "@/contexts/ColorsContext";
import Header from "@/components/Header";
import PrimaryButton from "@/components/PrimaryButton";
import BottomSheetModal from "@/components/BottomSheetModal";
import LegalContent from "@/components/LegalContent";
import ExitConfirmModal from "@/components/ExitConfirmModal";

export default function LoginPhoneScreen() {
  const router = useRouter();
  const { skipToLocationSetup, resetAll } = useAuth();
  const colors = useColors();
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [showTermsModal, setShowTermsModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);

  const isValidIndianNumber = (number: string): boolean => {
    const digits = (number ?? "").replace(/\D/g, "");
    if (digits.length !== 10) return false;
    const first = digits[0];
    return first >= "5" && first <= "9";
  };

  const handlePhoneChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric.length <= 10) {
      setPhoneNumber(numeric);
    }
  };

  const handleSendOTP = async () => {
    if (!isValidIndianNumber(phoneNumber)) return;
    setLoading(true);
    try {
      const result = await sendOtp(phoneNumber);
      setLoading(false);
      if (result.success) {
        const params: Record<string, string> = { phoneNumber };
        if (result.debugOtp) params.debugOtp = result.debugOtp;
        router.push({ pathname: "/otp", params });
      } else {
        Alert.alert("Error", result.error || result.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      Alert.alert("Error", "Failed to send OTP. Please try again.");
    }
  };

  const handleSkip = async () => {
    await skipToLocationSetup();
    router.replace("/location-type");
  };

  const handleLogout = () => setExitModalVisible(true);

  const handleExitConfirm = async () => {
    try {
      setExitLoading(true);
      await resetAll();
      setExitModalVisible(false);
      router.replace("/permissions");
    } catch {
      setExitLoading(false);
      setExitModalVisible(false);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setExitLoading(false);
    }
  };

  const isValid = isValidIndianNumber(phoneNumber);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.xl,
    },
    inputSection: {
      marginTop: Spacing.xl,
      marginBottom: Spacing['2xl'],
    },
    label: {
      fontSize: Typography.fontSize['md-lg'],
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.primary,
      marginBottom: Spacing.md,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: BorderRadius.lg,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg + 2,
      fontSize: Typography.fontSize['lg-md'],
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.primary,
      borderWidth: 1,
      borderColor: colors.border.medium,
    },
    spacer: {
      flex: 1,
      minHeight: Spacing['4xl'],
    },
    termsContainer: {
      marginBottom: Spacing['2xl'],
    },
    termsText: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.regular,
      color: colors.text.secondary,
      textAlign: "center",
      lineHeight: Typography.lineHeight.normal * Typography.fontSize.base,
    },
    termsLink: {
      color: colors.primary[650],
      fontWeight: Typography.fontWeight.semibold,
      textDecorationLine: "underline",
    },
    skipButton: {
      alignItems: "center",
      paddingVertical: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    skipText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.secondary,
    },
    buttonContainer: {
      marginBottom: Spacing.xl,
    },
  }), [colors]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Header 
        title="Sign in"
        subtitle="Enter your phone number"
        showBack={true}
        rightIcon={LogOut}
        onRightPress={handleLogout}
        rightIconColor={colors.text.secondary}
      />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.content}>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="0000000000"
              placeholderTextColor={colors.gray[300]}
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              keyboardType="number-pad"
              maxLength={10}
              autoFocus
            />
          </View>

          <View style={styles.spacer} />

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title="Send OTP" 
              onPress={handleSendOTP} 
              disabled={!isValid || loading}
              loading={loading}
            />
          </View>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By continuing, you agree to our{" "}
              <Text style={styles.termsLink} onPress={() => setShowTermsModal(true)}>Terms & Conditions</Text>
              {"\n"}and <Text style={styles.termsLink} onPress={() => setShowPrivacyModal(true)}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomSheetModal visible={showTermsModal} onClose={() => setShowTermsModal(false)} title="Terms & Conditions" height="80%" scrollable>
        <LegalContent type="terms" onAccept={() => setShowTermsModal(false)} />
      </BottomSheetModal>

      <BottomSheetModal visible={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} title="Privacy Policy" height="80%" scrollable>
        <LegalContent type="privacy" onAccept={() => setShowPrivacyModal(false)} />
      </BottomSheetModal>

      <ExitConfirmModal
        visible={exitModalVisible}
        onConfirm={handleExitConfirm}
        onCancel={() => !exitLoading && setExitModalVisible(false)}
        loading={exitLoading}
      />
    </KeyboardAvoidingView>
  );
}
