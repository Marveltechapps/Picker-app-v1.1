import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CreditCard, User, CheckCircle2, AlertTriangle } from "lucide-react-native";
import { setUpiApi } from "@/services/user.service";
import Header from "@/components/Header";
import { Colors, Typography, Spacing, BorderRadius, Shadows, IconSizes } from "@/config/theme";

const STORAGE_KEY = "@bank/upi_details";

export default function UpdateUpiDetailsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [upiId, setUpiId] = useState("arjunkumar@paytm");
  const [upiName, setUpiName] = useState("Arjun Kumar");

  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    loadUpiDetails();
  }, []);

  const loadUpiDetails = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const upiData = JSON.parse(data);
        setUpiId(upiData.upiId || "arjunkumar@paytm");
        setUpiName(upiData.upiName || "Arjun Kumar");
      }
    } catch (error) {
      console.error("Error loading UPI details:", error);
    }
  };

  const handleUpdate = async () => {
    if (!upiId || !upiName) {
      Alert.alert("Error", "Please fill all UPI details");
      return;
    }

    const upiRegex = /^[\w.-]+@[\w.-]+$/;
    if (!upiRegex.test(upiId)) {
      Alert.alert("Error", "Please enter a valid UPI ID");
      return;
    }

    setLoading(true);
    try {
      const result = await setUpiApi(upiId, upiName);
      const upiData = { upiId, upiName };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(upiData));
      setLoading(false);
      if (!result.success) {
        Alert.alert("Warning", result.error ?? "Saved locally but sync failed.");
        return;
      }
      Alert.alert(
        "Success",
        "UPI details updated successfully",
        [
          {
            text: "OK",
            onPress: () => {
              try {
                if (router.canGoBack()) router.back();
                else router.push("/bank-details");
              } catch {
                try { router.push("/bank-details"); } catch {}
              }
            },
          },
        ]
      );
    } catch {
      setLoading(false);
      Alert.alert("Error", "Failed to save UPI details");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Update UPI Details" />
      
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>UPI Payment Details</Text>
          <Text style={styles.sectionSubtitle}>Link your UPI ID for instant salary transfers</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI ID</Text>
            <View style={[styles.inputContainer, focusedField === "upiId" && styles.inputContainerFocused, upiId.length > 0 && !/^[\w.-]+@[\w.-]+$/.test(upiId) && styles.inputContainerError]}>
              <TextInput
                style={styles.input}
                value={upiId}
                onChangeText={setUpiId}
                placeholder="yourname@paytm"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                onFocus={() => setFocusedField("upiId")}
                onBlur={() => setFocusedField(null)}
              />
              {upiId.length > 0 && /^[\w.-]+@[\w.-]+$/.test(upiId) && (
                <CheckCircle2 color={Colors.success[400]} size={IconSizes.sm} strokeWidth={2} />
              )}
            </View>
            {upiId.length > 0 && !/^[\w.-]+@[\w.-]+$/.test(upiId) && (
              <Text style={styles.errorText}>Please enter a valid UPI ID</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>UPI Name</Text>
            <View style={[styles.inputContainer, focusedField === "upiName" && styles.inputContainerFocused]}>
              <TextInput
                style={styles.input}
                value={upiName}
                onChangeText={setUpiName}
                placeholder="Enter name as per UPI account"
                placeholderTextColor={Colors.text.tertiary}
                autoCapitalize="words"
                onFocus={() => setFocusedField("upiName")}
                onBlur={() => setFocusedField(null)}
              />
              {upiName.length > 0 && (
                <CheckCircle2 color={Colors.success[400]} size={IconSizes.sm} strokeWidth={2} />
              )}
            </View>
          </View>

          <View style={styles.infoBox}>
            <AlertTriangle color={Colors.warning[400]} size={IconSizes.md} strokeWidth={2} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoTitle}>Important</Text>
              <Text style={styles.infoText}>
                Verify your UPI ID is correct. Payments will be sent to this UPI address.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.updateButton, loading && styles.updateButtonDisabled]}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.updateButtonText}>
              {loading ? "Updating..." : "Update UPI Details"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing["2xl"],
  },
  sectionTitle: {
    fontSize: Typography.fontSize["3xl"],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    marginBottom: Spacing.xl,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  inputLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.gray[700],
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.gray[50],
    borderWidth: 1,
    borderColor: Colors.border.medium,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  inputContainerFocused: {
    borderColor: Colors.primary[500],
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: Colors.error[400],
  },
  input: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.primary,
    padding: 0,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.error[400],
    marginTop: Spacing.sm,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning[100],
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.secondary[700],
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.secondary[700],
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  updateButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  updateButtonDisabled: {
    opacity: 0.6,
  },
  updateButtonText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
});

