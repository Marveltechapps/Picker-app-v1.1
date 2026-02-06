import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, StatusBar, Image, Platform, InteractionManager } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, Zap, Target, AlertCircle, Smartphone, Clock, User, MapPin } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/state/authContext";
import { useLocation } from "@/state/locationContext";
import GenerateOtpSheet from "@/components/GenerateOtpSheet";
import { Shadows } from "@/constants/theme";

export default function GetStartedScreen() {
  const router = useRouter();
  const { selectedShifts, userProfile, phoneNumber } = useAuth();
  const {
    currentLocation,
    refreshLocation,
    getFormattedAddress,
    getAccuracyDisplay,
    locationPermission,
    startWatchingLocation,
    isWatching,
    requestPermission,
  } = useLocation();
  const [showGenerateOtp, setShowGenerateOtp] = useState<boolean>(false);
  const navigatingRef = useRef<boolean>(false);

  useEffect(() => {
    const run = async () => {
      if (locationPermission === 'granted') {
        if (!isWatching) startWatchingLocation();
        else refreshLocation().catch(() => {});
        return;
      }
      if (locationPermission === 'unavailable' || locationPermission === 'denied') {
        const ok = await requestPermission();
        if (ok) {
          await refreshLocation().catch(() => {});
          startWatchingLocation();
        }
      }
    };
    run();
  }, [locationPermission, startWatchingLocation, isWatching, refreshLocation, requestPermission]);

  const shiftTime = selectedShifts.length > 0 
    ? selectedShifts[0].time
    : "9:00 AM - 6:00 PM";

  const handleRead = () => {
    // Show Generate OTP popup
    setShowGenerateOtp(true);
  };

  const handleOtpGenerated = (otp: string) => {
    // Close the popup and navigate to collect device screen
    setShowGenerateOtp(false);
    router.push({ pathname: "/collect-device", params: { otp } });
  };

  const navigateToHome = () => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    InteractionManager.runAfterInteractions(() => {
      try {
        router.replace("/(tabs)");
      } catch {
        try {
          router.replace("/(tabs)/" as any);
        } catch {
          try {
            router.push("/(tabs)" as any);
          } catch {
            // ignore
          }
        }
      }
      navigatingRef.current = false;
    });
  };

  const handleDone = () => {
    navigateToHome();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {userProfile?.photoUri ? (
            <Image source={{ uri: userProfile.photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileIcon}>
              <User color="#6366F1" size={20} strokeWidth={2.5} />
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{userProfile?.name?.trim() || "User"}</Text>
            <Text style={styles.headerSubtitle}>ID: {phoneNumber ? phoneNumber.slice(-6) : "------"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Bell color="#6B7280" size={22} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Downtown Hub Card */}
        <View style={styles.mainCard}>
          <View style={styles.hubHeader}>
            <View style={styles.hubTitleRow}>
              <Text style={styles.hubTitle}>Downtown Hub</Text>
              <View style={styles.liveBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.locationIconButton}>
              <MapPin color="#9CA3AF" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <Text style={styles.addressText} numberOfLines={2}>
            {getFormattedAddress()}
          </Text>

          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Target color="#10B981" size={18} strokeWidth={2} />
              <View style={styles.statusItemContent}>
                <Text style={styles.statusLabel}>Accuracy</Text>
                <Text style={styles.statusValue}>{getAccuracyDisplay()}</Text>
              </View>
            </View>
            <View style={styles.statusItem}>
              <MapPin color="#6366F1" size={18} strokeWidth={2} />
              <View style={styles.statusItemContent}>
                <Text style={styles.statusLabel}>Status</Text>
                <Text style={styles.statusValueGreen}>
                  {currentLocation ? getFormattedAddress() : 'Locating...'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />
          <View style={styles.shiftRow}>
            <View style={styles.shiftLeft}>
              <View style={styles.clockIcon}>
                <Clock color="#6366F1" size={20} strokeWidth={2} />
              </View>
              <Text style={styles.shiftLabel}>Today&apos;s Shift</Text>
            </View>
            <Text style={styles.shiftTime}>{shiftTime}</Text>
          </View>

          <TouchableOpacity
            style={styles.startButton}
            onPress={navigateToHome}
          >
            <Text style={styles.startButtonText}>START MY SHIFT</Text>
          </TouchableOpacity>
        </View>

        {/* Get Started Card */}
        <View style={styles.getStartedCard}>
          <View style={styles.getStartedIcon}>
            <Zap color="#EC4899" size={24} strokeWidth={2.5} fill="#EC4899" />
          </View>
          <View style={styles.getStartedContent}>
            <Text style={styles.getStartedTitle}>Get Started</Text>
            <Text style={styles.getStartedSubtitle}>Start working in few steps</Text>
          </View>
          <TouchableOpacity style={styles.readButton} onPress={handleRead}>
            <Text style={styles.readButtonText}>Read &gt;</Text>
          </TouchableOpacity>
        </View>

        {/* Before You Punch In Card */}
        <View style={styles.beforePunchInCard}>
          <View style={styles.beforePunchInHeader}>
            <View style={styles.beforePunchInIcon}>
              <AlertCircle color="#F59E0B" size={24} strokeWidth={2.5} fill="#F59E0B" />
            </View>
            <View style={styles.beforePunchInContent}>
              <Text style={styles.beforePunchInTitle}>Before You Punch In...</Text>
              <Text style={styles.beforePunchInSubtitle}>Complete Mandatory Tasks before Punch In</Text>
            </View>
          </View>
          
          {/* Collect HHD Device Nested Card */}
          <View style={styles.hhdDeviceCard}>
            <View style={styles.hhdDeviceIcon}>
              <Smartphone color="#6366F1" size={24} strokeWidth={2.5} />
            </View>
            <View style={styles.hhdDeviceContent}>
              <Text style={styles.hhdDeviceTitle}>Collect HHD Device</Text>
              <Text style={styles.hhdDeviceSubtitle}>Get your handheld device from supervisor</Text>
            </View>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <GenerateOtpSheet
        visible={showGenerateOtp}
        onClose={() => setShowGenerateOtp(false)}
        onContinue={handleOtpGenerated}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 16,
    marginTop: 32,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#111827",
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  mainCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)' }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }
    ),
  },
  hubHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  hubTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hubTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#111827",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
  },
  liveText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: "#10B981",
    letterSpacing: 0.5,
  },
  locationIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  addressText: {
    fontSize: 14,
    fontWeight: "500" as const,
    color: "#6B7280",
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  statusItemContent: {
    flex: 1,
    minWidth: 0,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "500" as const,
    color: "#9CA3AF",
    marginBottom: 2,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#111827",
  },
  statusValueGreen: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#10B981",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 16,
  },
  shiftRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  shiftLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  clockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  shiftLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#111827",
  },
  shiftTime: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#6366F1",
  },
  startButton: {
    backgroundColor: "#6366F1",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  getStartedCard: {
    backgroundColor: "#FDF2F8",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FCE7F3",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  getStartedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  getStartedContent: {
    flex: 1,
  },
  getStartedTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#EC4899",
    marginBottom: 4,
  },
  getStartedSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#F472B6",
  },
  readButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  readButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  beforePunchInCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  beforePunchInHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  beforePunchInIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  beforePunchInContent: {
    flex: 1,
  },
  beforePunchInTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  beforePunchInSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  hhdDeviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  hhdDeviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  hhdDeviceContent: {
    flex: 1,
  },
  hhdDeviceTitle: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 4,
  },
  hhdDeviceSubtitle: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: "#6B7280",
  },
  doneButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  bottomSpacer: {
    height: 40,
  },
});

