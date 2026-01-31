import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView, Platform, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Smartphone, CheckCircle2, ChevronLeft } from "lucide-react-native";
import PrimaryButton from "@/components/PrimaryButton";

export default function CollectDeviceScreen() {
  const router = useRouter();
  const { otp } = useLocalSearchParams();
  const [collected, setCollected] = useState<boolean>(false);
  const navigatingRef = useRef<boolean>(false);

  const navigateToHome = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    InteractionManager.runAfterInteractions(() => {
      try {
        router.replace("/(tabs)");
      } catch (_) {
        try {
          router.push("/(tabs)" as any);
        } catch (_) {}
      }
      navigatingRef.current = false;
    });
  };

  const handleComplete = () => {
    if (collected) navigateToHome();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/get-started");
              }
            } catch (error) {
              // Silently handle navigation error
              try {
                router.push("/get-started");
              } catch {
                // Fallback failed
              }
            }
          }}
        >
          <ChevronLeft color="#111827" size={28} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collect Device</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Smartphone color="#8B5CF6" size={56} strokeWidth={2.5} />
          </View>

          <Text style={styles.title}>Collect HHD Device</Text>
          <Text style={styles.subtitle}>
            Get your handheld device from supervisor
          </Text>

          <View style={styles.deviceCard}>
            <View style={styles.deviceIllustration}>
              <View style={styles.deviceScreen}>
                <Smartphone color="#6366F1" size={80} strokeWidth={1.5} />
              </View>
              <Text style={styles.deviceLabel}>Handheld Device (HHD)</Text>
            </View>
          </View>

          <View style={styles.stepsCard}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Go to Supervisor Desk</Text>
                <Text style={styles.stepText}>Visit the supervisor&apos;s desk at the warehouse</Text>
              </View>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>📍</Text>
              </View>
            </View>

            <View style={styles.stepDivider} />

            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Show Your OTP</Text>
                <Text style={styles.stepText}>
                  Present the OTP code{" "}
                  {otp && (
                    <Text style={styles.otpHighlight}>{otp}</Text>
                  )}
                  {" "}to verify your identity
                </Text>
              </View>
              <View style={styles.stepIcon}>
                <Text style={styles.stepIconText}>#️⃣</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkboxCard}
            onPress={() => setCollected(!collected)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, collected && styles.checkboxChecked]}>
              {collected && <CheckCircle2 color="#10B981" size={24} strokeWidth={2.5} fill="#10B981" />}
            </View>
            <Text style={styles.checkboxLabel}>
              I&apos;ve collected my handheld device
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          title="I've Collected My Device"
          onPress={handleComplete}
          disabled={!collected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: -0.3,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  headerRight: {
    width: 44,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#F5F3FF",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  deviceCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 20,
    padding: 32,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  deviceIllustration: {
    alignItems: "center",
  },
  deviceScreen: {
    width: 160,
    height: 200,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#E5E7EB",
  },
  deviceLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6B7280",
  },
  stepsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  stepText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 18,
  },
  otpHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6366F1",
  },
  stepIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  stepIconText: {
    fontSize: 24,
  },
  stepDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
    marginLeft: 44,
  },
  checkboxCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    borderColor: "transparent",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    ...(Platform.OS === "web"
      ? { boxShadow: "0px -2px 8px rgba(0, 0, 0, 0.05)", elevation: 8 }
      : {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        }),
  },
});

