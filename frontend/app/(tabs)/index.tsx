import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Pressable, StatusBar, Dimensions, Image, Platform } from "react-native";
import { TouchableOpacity as GestureTouchableOpacity } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, Bell, Calendar, Zap, Package, DollarSign, Target, Info, User } from "lucide-react-native";
import { router } from "expo-router";
import { Typography, Spacing, BorderRadius, Shadows, IconSizes } from "@/constants/theme";
import { useColors } from "@/contexts/ColorsContext";
import LocationVerifySheet from "@/components/LocationVerifySheet";
import IdentityVerifySheet from "@/components/IdentityVerifySheet";
import FaceVerifySheet from "@/components/FaceVerifySheet";
import FingerprintVerifySheet from "@/components/FingerprintVerifySheet";
import ShiftSuccessSheet from "@/components/ShiftSuccessSheet";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAuth } from "@/state/authContext";
import { useLocation } from "@/state/locationContext";
import { startShiftApi, endShiftApi } from "@/services/shifts.service";
import { getAttendanceStats, type AttendanceStats } from "@/services/attendance.service";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

const { width } = Dimensions.get("window");

export default function HomeScreen() {
  const auth = useAuth();
  const selectedShifts = auth?.selectedShifts ?? [];
  const shiftActive = auth?.shiftActive ?? false;
  const shiftStartTime = auth?.shiftStartTime ?? null;
  const startShift = auth?.startShift ?? (async () => {});
  const endShift = auth?.endShift ?? (async () => {});
  const userProfile = auth?.userProfile ?? null;
  const phoneNumber = auth?.phoneNumber ?? null;
  const unreadCount = auth?.unreadCount ?? 0;
  const locationType = auth?.locationType ?? null;
  const { 
    startWatchingLocation, 
    stopWatchingLocation, 
    locationPermission,
    getFormattedAddress,
    getAccuracyDisplay,
    currentLocation
  } = useLocation();
  const colors = useColors();
  const [showLocationVerify, setShowLocationVerify] = useState(false);
  const [showIdentityVerify, setShowIdentityVerify] = useState(false);
  const [showFaceVerify, setShowFaceVerify] = useState(false);
  const [showFingerprintVerify, setShowFingerprintVerify] = useState(false);
  const [showShiftSuccess, setShowShiftSuccess] = useState(false);
  const [showCheckoutConfirmation, setShowCheckoutConfirmation] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [startWorkLoading, setStartWorkLoading] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<"face" | "fingerprint">("face");
  const [elapsedTime, setElapsedTime] = useState(0);
  const verificationSuccessFiredRef = useRef(false);
  const [dashboardStats, setDashboardStats] = useState<AttendanceStats | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // Start/stop location watching based on shift status
  useEffect(() => {
    if (shiftActive && (locationPermission === 'granted' || Platform.OS === 'web')) {
      startWatchingLocation();
    } else {
      stopWatchingLocation();
    }

    return () => {
      stopWatchingLocation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftActive, locationPermission]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (shiftActive && shiftStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - shiftStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [shiftActive, shiftStartTime]);

  const formatElapsedTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartShiftNew = useCallback(() => {
    if (shiftActive) return;
    setShowLocationVerify(true);
  }, [shiftActive]);

  const handleLocationVerifySuccess = () => {
    setShowLocationVerify(false);
    setTimeout(() => {
      setShowIdentityVerify(true);
    }, 300);
  };

  const handleIdentityMethodSelect = (method: "face" | "fingerprint") => {
    setVerificationMethod(method);
    setShowIdentityVerify(false);
    // Minimal delay so identity sheet starts closing; keeps flow snappy in Expo Go
    setTimeout(() => {
      if (method === "face") {
        setShowFaceVerify(true);
      } else {
        setShowFingerprintVerify(true);
      }
    }, 50);
  };

  const handleVerificationSuccess = useCallback(() => {
    if (verificationSuccessFiredRef.current) return;
    verificationSuccessFiredRef.current = true;
    if (verificationMethod === "face") {
      setShowFaceVerify(false);
    } else {
      setShowFingerprintVerify(false);
    }
    setTimeout(() => {
      setShowShiftSuccess(true);
    }, 300);
  }, [verificationMethod]);

  useEffect(() => {
    if (!showFaceVerify && !showFingerprintVerify && !showShiftSuccess) {
      verificationSuccessFiredRef.current = false;
    }
  }, [showFaceVerify, showFingerprintVerify, showShiftSuccess]);

  useEffect(() => {
    let cancelled = false;
    setDashboardLoading(true);
    setDashboardError(null);
    getAttendanceStats()
      .then((data) => {
        if (!cancelled) {
          setDashboardStats(data ?? null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDashboardError(err instanceof Error ? err.message : "Failed to load dashboard");
          setDashboardStats(null);
        }
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const handleStartWork = useCallback(async () => {
    if (startWorkLoading) return;
    setStartWorkLoading(true);
    const optimisticStartTime = Date.now();
    try {
      // Start shift immediately in UI so user sees feedback (shift timing ON)
      await startShift(optimisticStartTime);
      setShowShiftSuccess(false);
      // Sync with server in background; use server time if returned
      const result = await startShiftApi();
      if (result.success && result.shiftStartTime != null) {
        await startShift(result.shiftStartTime);
      }
    } catch {
      // Shift already started optimistically; keep it
    } finally {
      setStartWorkLoading(false);
    }
  }, [startWorkLoading, startShift]);

  const handleCheckOut = useCallback(() => {
    if (!shiftActive) return;
    setShowCheckoutConfirmation(true);
  }, [shiftActive]);

  const handleConfirmCheckOut = useCallback(async () => {
    if (checkoutLoading) return;
    setCheckoutLoading(true);
    // Optimistic update: close modal and end shift in UI immediately so checkout feels instant
    setShowCheckoutConfirmation(false);
    await endShift();
    setElapsedTime(0);
    setCheckoutLoading(false);
    // Sync with server in background; shift end time is recorded by the API.
    // No alerts or toasts shown so checkout stays silent (Expo Go and all platforms).
    try {
      const result = await endShiftApi();
      if (!result.success && result.error && __DEV__) {
        console.warn("[Checkout] Server sync failed:", result.error);
      }
    } catch (err) {
      if (__DEV__) {
        console.warn("[Checkout] Server sync failed:", err);
      }
    }
  }, [checkoutLoading, endShift]);

  const handleCancelCheckOut = useCallback(() => {
    setShowCheckoutConfirmation(false);
  }, []);

  const handleCloseSheet = () => {
    setShowLocationVerify(false);
    setShowIdentityVerify(false);
    setShowFaceVerify(false);
    setShowFingerprintVerify(false);
    setShowShiftSuccess(false);
  };

  const shiftTime = selectedShifts.length > 0 
    ? selectedShifts[0].time
    : "9:00 AM - 6:00 PM";

  const weeklyData = (dashboardStats?.weeklyEarnings?.length)
    ? dashboardStats.weeklyEarnings
    : [];
  const maxValue = weeklyData.length ? Math.max(...weeklyData.map((d) => d.value), 1) : 1;
  const chartHeight = 200;

  const todayOrders = dashboardStats?.todayOrders ?? 0;
  const todayEarnings = dashboardStats?.todayEarnings ?? 0;
  const todayIncentives = dashboardStats?.todayIncentives ?? 0;
  const performance = dashboardStats?.performance;
  const hubNameFromApi = dashboardStats?.hubName?.trim() || null;
  // Prefer user's location type so "Dark store" / "Warehouse" is correct in Expo Go; use API only when locationType not set
  const hubName =
    locationType === "darkstore"
      ? "Dark store"
      : locationType === "warehouse"
        ? "Warehouse"
        : (hubNameFromApi ?? "—");

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.lg,
      marginTop: Spacing['3xl'],
      paddingHorizontal: Spacing.xl,
      backgroundColor: colors.card,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    profileIcon: {
      width: Spacing['4xl'],
      height: Spacing['4xl'],
      borderRadius: Spacing.xl,
      backgroundColor: colors.primary[100],
      alignItems: "center",
      justifyContent: "center",
    },
    profileImage: {
      width: Spacing['4xl'],
      height: Spacing['4xl'],
      borderRadius: Spacing.xl,
      backgroundColor: colors.primary[100],
    },
    headerTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    headerSubtitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
      marginTop: Spacing.xs / 2,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.lg,
    },
    headerIcon: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
      position: "relative" as const,
    },
    notificationDot: {
      position: "absolute" as const,
      top: 0,
      right: 0,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#EF4444",
    },
    mainCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginTop: Spacing.xl,
      marginBottom: Spacing.lg,
      ...Shadows.md,
    },
    hubHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: Spacing.sm,
    },
    hubTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    hubTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.success[50],
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius['xs-sm'],
      gap: Spacing.xs,
    },
    liveDot: {
      width: Spacing['xs-sm'],
      height: Spacing['xs-sm'],
      borderRadius: Spacing['xs-sm'] / 2,
      backgroundColor: colors.success[400],
    },
    liveText: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.bold,
      color: colors.success[400],
    },
    locationIconButton: {
      width: Spacing['4xl'],
      height: Spacing['4xl'],
      borderRadius: Spacing.xl,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
    },
    addressText: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: Spacing.lg,
    },
    statusRow: {
      flexDirection: "row",
      gap: Spacing['2xl'],
      marginBottom: Spacing.lg,
    },
    statusItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    statusItemContent: {
      flex: 1,
      minWidth: 0,
    },
    statusLabel: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.tertiary,
    },
    statusValue: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    statusValueGreen: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.bold,
      color: colors.success[400],
      flexShrink: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginBottom: Spacing.lg,
    },
    shiftRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    shiftLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    clockIcon: {
      width: Spacing['3xl'],
      height: Spacing['3xl'],
      borderRadius: Spacing.lg,
      backgroundColor: colors.primary[50],
      alignItems: "center",
      justifyContent: "center",
    },
    clockEmoji: {
      fontSize: Typography.fontSize.lg,
    },
    shiftLabel: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.primary,
    },
    shiftTime: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary[600],
    },
    startButton: {
      flexDirection: "row",
      backgroundColor: colors.primary[600],
      borderRadius: BorderRadius.md,
      paddingVertical: Spacing.lg,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
    },
    checkOutButton: {
      backgroundColor: colors.error[400],
    },
    shiftActiveRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.success[50],
      borderRadius: BorderRadius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    shiftActiveLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    shiftActiveDot: {
      width: Spacing.md,
      height: Spacing.md,
      borderRadius: BorderRadius['xs-sm'],
      backgroundColor: colors.success[400],
    },
    shiftActiveLabel: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.success[400],
    },
    timerContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      backgroundColor: colors.card,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.sm,
    },
    timerText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary[600],
      fontVariant: ["tabular-nums"],
    },
    startButtonText: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.white,
      letterSpacing: Typography.letterSpacing.wider,
    },
    ordersCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      ...Shadows.md,
    },
    ordersHeader: {
      flexDirection: "row",
      gap: Spacing.lg,
    },
    packageIconContainer: {
      width: 56,
      height: 56,
      borderRadius: BorderRadius.lg,
      backgroundColor: colors.info[50],
      alignItems: "center",
      justifyContent: "center",
    },
    ordersContent: {
      flex: 1,
    },
    ordersTop: {
      flexDirection: "row",
      alignItems: "baseline",
      marginBottom: Spacing.xs,
    },
    ordersMainNumber: {
      fontSize: Typography.fontSize['5xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    ordersTotal: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
      marginLeft: Spacing.xs,
    },
    ordersToGo: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary[600],
      marginLeft: "auto",
    },
    ordersLabel: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: Spacing.sm,
    },
    progressBarContainer: {
      height: Spacing.sm,
      backgroundColor: colors.border.light,
      borderRadius: BorderRadius.xs,
      overflow: "hidden",
    },
    progressBarFill: {
      height: "100%",
      backgroundColor: colors.primary[600],
      borderRadius: BorderRadius.xs,
    },
    metricsRow: {
      flexDirection: "row",
      gap: Spacing.md,
      marginBottom: Spacing.lg,
    },
    earningsCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.md,
    },
    earningsIcon: {
      width: Spacing['5xl'],
      height: Spacing['5xl'],
      borderRadius: Spacing['2xl'],
      backgroundColor: colors.secondary[200],
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    earningsValue: {
      fontSize: Typography.fontSize['4xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: Spacing.xs,
    },
    earningsLabel: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
    },
    incentivesCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.md,
    },
    incentivesIcon: {
      width: Spacing['5xl'],
      height: Spacing['5xl'],
      borderRadius: Spacing['2xl'],
      backgroundColor: colors.primary[600],
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    incentivesValue: {
      fontSize: Typography.fontSize['4xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: Spacing.xs,
    },
    incentivesLabel: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
    },
    performanceCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      ...Shadows.md,
    },
    performanceHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    performanceTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    topBadge: {
      backgroundColor: colors.success[50],
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.md,
    },
    topBadgeText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.bold,
      color: colors.success[400],
    },
    metricRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    metricLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing['xs-sm'],
    },
    performanceLabel: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
    },
    performanceValue: {
      fontSize: Typography.fontSize.lg,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
    },
    progressBar: {
      height: Spacing.sm,
      backgroundColor: colors.border.light,
      borderRadius: BorderRadius.xs,
      marginBottom: Spacing.lg,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: BorderRadius.xs,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      marginBottom: Spacing.lg,
      ...Shadows.md,
    },
    chartTitle: {
      fontSize: Typography.fontSize.xl,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: Spacing.xs,
    },
    chartSubtitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.secondary,
      marginBottom: Spacing.lg,
    },
    chartContainer: {
      flexDirection: "row",
      height: 240,
    },
    yAxisLabels: {
      justifyContent: "space-between",
      paddingRight: Spacing.sm,
      paddingVertical: Spacing['sm-md'],
    },
    yAxisLabel: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.tertiary,
    },
    chartContent: {
      flex: 1,
    },
    xAxisLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 0,
      marginTop: Spacing.sm,
    },
    xAxisLabel: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.medium,
      color: colors.text.tertiary,
    },
    autoOtpOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.7)",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    autoOtpContainer: {
      backgroundColor: colors.card,
      borderRadius: BorderRadius['2xl'],
      padding: Spacing['4xl'],
      alignItems: "center",
      width: width - Spacing['6xl'],
    },
    autoOtpIcon: {
      width: 80,
      height: 80,
      borderRadius: Spacing['4xl'],
      backgroundColor: colors.primary[50],
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xl,
    },
    autoOtpIconText: {
      fontSize: Spacing['4xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary[500],
    },
    autoOtpTitle: {
      fontSize: Typography.fontSize['2xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: Spacing.lg,
      textAlign: "center",
    },
    autoOtpCountdown: {
      fontSize: Typography.fontSize['7xl'],
      fontWeight: Typography.fontWeight.bold,
      color: colors.primary[600],
      marginBottom: Spacing.md,
    },
    autoOtpGenerated: {
      fontSize: Typography.fontSize.md,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.secondary,
    },
    bottomSpacer: {
      height: 100,
    },
  }), [colors]);

  const statusBarStyle = colors.background === '#111827' ? 'light-content' : 'dark-content';
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={statusBarStyle} />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {userProfile?.photoUri ? (
            <Image source={{ uri: userProfile.photoUri }} style={styles.profileImage} />
          ) : (
            <View style={styles.profileIcon}>
              <User color={colors.primary[600]} size={IconSizes.md} strokeWidth={2.5} />
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{userProfile?.name?.trim() || "User"}</Text>
            <Text style={styles.headerSubtitle}>ID: {phoneNumber ? phoneNumber.slice(-6) : "------"}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIcon}>
            <Zap color={colors.secondary[400]} size={IconSizes.md} strokeWidth={2} fill={colors.secondary[400]} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon} 
            onPress={() => {
              try {
                router.push('/notifications');
              } catch (error) {
                // Silently handle navigation error
              }
            }}
            activeOpacity={0.7}
          >
            <Bell color={colors.text.secondary} size={IconSizes.md} strokeWidth={2} />
            {unreadCount > 0 && <View style={styles.notificationDot} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <View style={styles.mainCard} pointerEvents="box-none">
          <View style={styles.hubHeader}>
            <View style={styles.hubTitleRow}>
              <Text style={styles.hubTitle}>{dashboardLoading ? "—" : hubName}</Text>
              {shiftActive && (
                <View style={styles.liveBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>LIVE</Text>
                </View>
              )}
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

          {shiftActive && (
            <>
              <View style={styles.divider} />
              <View style={styles.shiftActiveRow}>
                <View style={styles.shiftActiveLeft}>
                  <View style={styles.shiftActiveDot} />
                  <Text style={styles.shiftActiveLabel}>Shift Active</Text>
                </View>
                <View style={styles.timerContainer}>
                  <Text style={styles.clockEmoji}>⏱️</Text>
                  <Text style={styles.timerText}>{formatElapsedTime(elapsedTime)}</Text>
                </View>
              </View>
            </>
          )}

          {!shiftActive && (
            <>
              <View style={styles.divider} />
              <View style={styles.shiftRow}>
                <View style={styles.shiftLeft}>
                  <View style={styles.clockIcon}>
                    <Text style={styles.clockEmoji}>🕐</Text>
                  </View>
                  <Text style={styles.shiftLabel}>Today&apos;s Shift</Text>
                </View>
                <Text style={styles.shiftTime}>{shiftTime}</Text>
              </View>
            </>
          )}

          {Platform.OS === "web" ? (
            <Pressable
              style={({ pressed }) => [
                styles.startButton,
                shiftActive && styles.checkOutButton,
                pressed && { opacity: 0.7 },
              ]}
              onPress={() => {
                if (shiftActive) {
                  handleCheckOut();
                } else {
                  handleStartShiftNew();
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={shiftActive ? "Check out" : "Start my shift"}
            >
              <Text style={styles.startButtonText}>{shiftActive ? "CHECK OUT" : "START MY SHIFT"}</Text>
            </Pressable>
          ) : (
            <GestureTouchableOpacity
              style={[styles.startButton, shiftActive && styles.checkOutButton]}
              onPress={() => {
                if (shiftActive) {
                  handleCheckOut();
                } else {
                  handleStartShiftNew();
                }
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessible
              accessibilityRole="button"
              accessibilityLabel={shiftActive ? "Check out" : "Start my shift"}
            >
              <Text style={styles.startButtonText}>{shiftActive ? "CHECK OUT" : "START MY SHIFT"}</Text>
            </GestureTouchableOpacity>
          )}
        </View>

        <View style={styles.ordersCard}>
          <View style={styles.ordersHeader}>
            <View style={styles.packageIconContainer}>
              <Package color="#3B82F6" size={28} strokeWidth={2} />
            </View>
            <View style={styles.ordersContent}>
              <View style={styles.ordersTop}>
                <Text style={styles.ordersMainNumber}>{dashboardLoading ? "—" : todayOrders}</Text>
                <Text style={styles.ordersTotal}> orders</Text>
              </View>
              <Text style={styles.ordersLabel}>Orders Picked Today</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: todayOrders > 0 ? `${Math.min(100, todayOrders)}%` : "0%" }]} />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.earningsCard}>
            <View style={styles.earningsIcon}>
              <DollarSign color="#FFFFFF" size={28} strokeWidth={2.5} />
            </View>
            <Text style={styles.earningsValue}>{dashboardLoading ? "—" : `₹${todayEarnings}`}</Text>
            <Text style={styles.earningsLabel}>Today&apos;s Earnings</Text>
          </View>
          <View style={styles.incentivesCard}>
            <View style={styles.incentivesIcon}>
              <Zap color="#FFFFFF" size={28} strokeWidth={2.5} fill="#FFFFFF" />
            </View>
            <Text style={styles.incentivesValue}>{dashboardLoading ? "—" : `₹${todayIncentives}`}</Text>
            <Text style={styles.incentivesLabel}>Incentives of the Day</Text>
          </View>
        </View>

        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Text style={styles.performanceTitle}>Performance Metrics</Text>
            {performance && performance.topPercent > 0 ? (
              <View style={styles.topBadge}>
                <Text style={styles.topBadgeText}>Top {performance.topPercent}%</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLabelRow}>
              <Text style={styles.performanceLabel}>Accuracy</Text>
              <Info color="#D1D5DB" size={16} strokeWidth={2} />
            </View>
            <Text style={styles.performanceValue}>
              {dashboardLoading ? "—" : (performance?.accuracy ? `${performance.accuracy}%` : "—")}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: performance?.accuracy ? `${performance.accuracy}%` : "0%", backgroundColor: "#10B981" }]} />
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricLabelRow}>
              <Text style={styles.performanceLabel}>Speed</Text>
              <Info color="#D1D5DB" size={16} strokeWidth={2} />
            </View>
            <Text style={styles.performanceValue}>
              {dashboardLoading ? "—" : (performance?.speed ? `${performance.speed} items/hr` : "—")}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: performance?.speed ? "85%" : "0%", backgroundColor: "#6366F1" }]} />
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Earnings</Text>
          <Text style={styles.chartSubtitle}>Your performance this week</Text>
          <View style={styles.chartContainer}>
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>₹{maxValue >= 800 ? Math.round(maxValue / 4) * 4 : maxValue}</Text>
              <Text style={styles.yAxisLabel}>₹{maxValue >= 400 ? Math.round(maxValue / 2) : Math.round(maxValue / 4)}</Text>
              <Text style={styles.yAxisLabel}>₹{Math.round(maxValue / 4)}</Text>
              <Text style={styles.yAxisLabel}>₹0</Text>
            </View>
            <View style={styles.chartContent}>
              {weeklyData.length > 0 ? (
                <>
                  <Svg width="100%" height={chartHeight} viewBox={`0 0 ${width - 120} ${chartHeight}`}>
                    <Defs>
                      <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                        <Stop offset="100%" stopColor="#6366F1" stopOpacity="0.05" />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d={(() => {
                        const w = width - 120;
                        const n = weeklyData.length;
                        const step = n > 1 ? w / (n - 1) : w;
                        let area = `M 0 ${chartHeight - (weeklyData[0].value / maxValue) * (chartHeight - 20)}`;
                        for (let i = 1; i < n; i++) {
                          area += ` L ${step * i} ${chartHeight - (weeklyData[i].value / maxValue) * (chartHeight - 20)}`;
                        }
                        area += ` L ${w} ${chartHeight} L 0 ${chartHeight} Z`;
                        return area;
                      })()}
                      fill="url(#gradient)"
                    />
                    <Path
                      d={(() => {
                        const w = width - 120;
                        const n = weeklyData.length;
                        const step = n > 1 ? w / (n - 1) : w;
                        let line = `M 0 ${chartHeight - (weeklyData[0].value / maxValue) * (chartHeight - 20)}`;
                        for (let i = 1; i < n; i++) {
                          line += ` L ${step * i} ${chartHeight - (weeklyData[i].value / maxValue) * (chartHeight - 20)}`;
                        }
                        return line;
                      })()}
                      stroke="#6366F1"
                      strokeWidth="3"
                      fill="none"
                    />
                  </Svg>
                  <View style={styles.xAxisLabels}>
                    {weeklyData.map((item, index) => (
                      <Text key={index} style={styles.xAxisLabel}>{item.day}</Text>
                    ))}
                  </View>
                </>
              ) : (
                <View style={{ height: chartHeight, justifyContent: "center", alignItems: "center" }}>
                  <Text style={[styles.xAxisLabel, { color: colors.text.tertiary }]}>
                    {dashboardLoading ? "Loading..." : "No data"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <LocationVerifySheet
        visible={showLocationVerify}
        onSuccess={handleLocationVerifySuccess}
        onClose={handleCloseSheet}
      />

      <IdentityVerifySheet
        visible={showIdentityVerify}
        onSelectMethod={handleIdentityMethodSelect}
        onClose={handleCloseSheet}
        onBack={() => {
          setShowIdentityVerify(false);
          setTimeout(() => {
            setShowLocationVerify(true);
          }, 300);
        }}
      />

      {showFaceVerify && (
        <FaceVerifySheet
          visible={showFaceVerify}
          onSuccess={handleVerificationSuccess}
          onClose={handleCloseSheet}
          onBack={() => {
            setShowFaceVerify(false);
            setTimeout(() => {
              setShowIdentityVerify(true);
            }, 300);
          }}
        />
      )}

      {showFingerprintVerify && (
        <FingerprintVerifySheet
          visible={showFingerprintVerify}
          onSuccess={handleVerificationSuccess}
          onClose={handleCloseSheet}
          onBack={() => {
            setShowFingerprintVerify(false);
            setTimeout(() => {
              setShowIdentityVerify(true);
            }, 300);
          }}
        />
      )}

      <ShiftSuccessSheet
        visible={showShiftSuccess}
        verificationMethod={verificationMethod}
        onStartWork={handleStartWork}
        startWorkLoading={startWorkLoading}
        onClose={handleCloseSheet}
        onBack={() => {
          setShowShiftSuccess(false);
          setTimeout(() => {
            if (verificationMethod === "face") {
              setShowFaceVerify(true);
            } else {
              setShowFingerprintVerify(true);
            }
          }, 300);
        }}
      />

      <ConfirmationModal
        visible={showCheckoutConfirmation}
        title="Early Checkout Confirmation"
        message="You are about to check out early. Are you sure you want to proceed?"
        confirmText="Confirm"
        cancelText="Cancel"
        onConfirm={handleConfirmCheckOut}
        onCancel={handleCancelCheckOut}
        loading={checkoutLoading}
      />
    </SafeAreaView>
  );
}
