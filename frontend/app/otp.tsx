import React, { useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LogOut } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { verifyOtp, resendOtp } from "@/services/auth.service";
import { getProfileApi } from "@/services/user.service";
import { Colors, Typography, Spacing, BorderRadius } from "@/config/theme";
import Header from "@/components/Header";
import PrimaryButton from "@/components/PrimaryButton";
import ExitConfirmModal from "@/components/ExitConfirmModal";

const AUTH_TOKEN_KEY = "@auth/token";
const RESEND_COOLDOWN_SEC = 60;

export default function OTPScreen() {
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const { phoneNumber, debugOtp } = useLocalSearchParams<{ phoneNumber?: string; debugOtp?: string }>();
  const { completeLogin, completeProfile, resetAll } = useAuth();
  const [otp, setOtp] = useState<string[]>(() => {
    const d = typeof debugOtp === "string" ? debugOtp : Array.isArray(debugOtp) ? debugOtp[0] : "";
    if (d && /^\d{4}$/.test(d)) return d.split("");
    return ["", "", "", ""];
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const [resendCountdown, setResendCountdown] = useState<number>(RESEND_COOLDOWN_SEC);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const id = setInterval(() => {
      setResendCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [resendCountdown]);

  const handleOtpChange = (text: string, index: number) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric.length > 1) {
      const digits = numeric.split("").slice(0, 4);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 4) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 3);
      inputRefs.current[nextIndex]?.focus();
    } else {
      const newOtp = [...otp];
      newOtp[index] = numeric;
      setOtp(newOtp);
      if (numeric && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpValue = otp.join("");
    if (otpValue.length !== 4) return;
    const ph = typeof phoneNumber === "string" ? phoneNumber : Array.isArray(phoneNumber) ? phoneNumber[0] : "";
    if (!ph || String(ph).replace(/\D/g, "").length !== 10) {
      Alert.alert("Error", "Phone number is missing or invalid. Please go back and enter your number.");
      return;
    }
    if (__DEV__) console.log("[otp] handleVerifyOTP called – phone:", ph);
    setLoading(true);
    try {
      const result = await verifyOtp(ph, otpValue);
      setLoading(false);
      if (__DEV__) console.log("[otp] verifyOtp result – success:", result?.success, "hasToken:", !!result?.token);
      if (result.success && result.token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, result.token);
        await completeLogin(ph);
        try {
          const profileData = await getProfileApi();
          if (profileData) {
            const profile = {
              name: profileData.name?.trim() || "User",
              age: typeof profileData.age === "number" ? profileData.age : 0,
              gender: (profileData.gender === "female" ? "female" : "male") as "male" | "female",
              photoUri: profileData.photoUri || "",
              email: profileData.email || undefined,
              createdAt: profileData.createdAt,
            };
            await completeProfile(profile);
          }
        } catch (_) {
          // Non-blocking: app works without profile hydration
        }
        router.replace("/profile");
      } else {
        Alert.alert("Error", result.error || "Invalid or expired OTP. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (__DEV__) console.log("[otp] handleVerifyOTP catch – error.message:", errMsg);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    }
  };

  const handleResend = async () => {
    const ph = typeof phoneNumber === "string" ? phoneNumber : Array.isArray(phoneNumber) ? phoneNumber[0] : "";
    if (!ph || String(ph).replace(/\D/g, "").length !== 10) {
      Alert.alert("Error", "Phone number is missing. Please go back to login.");
      return;
    }
    if (__DEV__) console.log("[otp] handleResend called – phone:", ph);
    setLoading(true);
    try {
      const result = await resendOtp(ph);
      setLoading(false);
      if (__DEV__) console.log("[otp] resendOtp result – success:", result?.success);
      if (result.success) {
        setResendCountdown(RESEND_COOLDOWN_SEC);
        if (result.debugOtp) {
          Alert.alert("OTP Sent (debug)", `Use this OTP to verify: ${result.debugOtp}`);
          setOtp(result.debugOtp.split("").slice(0, 4));
        } else {
          Alert.alert("OTP Sent", "A new code has been sent to your phone.");
        }
      } else {
        Alert.alert("Error", result.error || result.message || "Failed to resend OTP.");
      }
    } catch (error) {
      setLoading(false);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (__DEV__) console.log("[otp] handleResend catch – error.message:", errMsg);
      Alert.alert("Error", "Failed to resend OTP.");
    }
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

  const isValid = otp.every((digit) => digit !== "");

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <Header 
        title="Verify OTP"
        subtitle="Enter the code sent to your phone"
        showBack={canGoBack}
        rightIcon={LogOut}
        onRightPress={handleLogout}
        rightIconColor={Colors.text.secondary}
      />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.subtitle}>
              Enter the 4-digit code sent to{"\n"}
              <Text style={styles.phoneNumber}>{phoneNumber}</Text>
            </Text>
            {debugOtp && (
              <Text style={styles.debugOtpHint}>Dev OTP (for testing): {debugOtp}</Text>
            )}
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                style={[styles.otpInput, digit && styles.otpInputFilled]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResend}
            disabled={loading || resendCountdown > 0}
          >
            <Text style={styles.resendText}>
              {resendCountdown > 0
                ? `Resend in ${resendCountdown}s`
                : "Didn't receive the code? "}
              {resendCountdown === 0 && <Text style={styles.resendLink}>Resend</Text>}
            </Text>
          </TouchableOpacity>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title="Verify OTP" 
              onPress={handleVerifyOTP} 
              disabled={!isValid}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>

      <ExitConfirmModal
        visible={exitModalVisible}
        onConfirm={handleExitConfirm}
        onCancel={() => !exitLoading && setExitModalVisible(false)}
        loading={exitLoading}
      />
    </KeyboardAvoidingView>
  );
}

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
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  titleSection: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.lg,
  },
  phoneNumber: {
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary[650],
  },
  debugOtpHint: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.gray[500],
    fontFamily: "monospace",
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xl,
    marginBottom: Spacing['3xl'],
  },
  otpInput: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 56,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: "center",
  },
  otpInputFilled: {
    borderColor: Colors.primary[650],
    backgroundColor: Colors.primary[100],
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  resendText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
  },
  resendLink: {
    color: Colors.primary[650],
    fontWeight: Typography.fontWeight.bold,
  },
  buttonContainer: {
    marginTop: Spacing['3xl'],
    marginBottom: Spacing.xl,
  },
});
