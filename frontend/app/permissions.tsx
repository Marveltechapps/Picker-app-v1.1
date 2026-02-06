import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Bell, Camera, Battery, MapPin, MapPinned } from "lucide-react-native";
import { useAuth, PermissionsState } from "@/state/authContext";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import PermissionCard from "@/components/PermissionCard";
import PermissionModal from "@/components/PermissionModal";
import PrimaryButton from "@/components/PrimaryButton";
import { requestNotificationPermissions, registerForPushNotifications, sendTokenToBackend } from "@/utils/notificationService";
import { useLocation } from "@/state/locationContext";
import Constants from "expo-constants";

const PERMISSIONS_LIST: {
  key: keyof PermissionsState;
  icon: typeof Bell;
  title: string;
  description: string;
}[] = [
  {
    key: "pushNotifications",
    icon: Bell,
    title: "Push Notification",
    description: "Turn on notifications to get updates about your application",
  },
  {
    key: "camera",
    icon: Camera,
    title: "Camera",
    description: "We need your camera to take pictures or upload documents",
  },
  {
    key: "battery",
    icon: Battery,
    title: "Battery Usage",
    description: "We need you to allow unrestricted battery usage to connect you to nearby Stores",
  },
  {
    key: "location",
    icon: MapPin,
    title: "Location",
    description: "We need your location to connect you to nearby Stores",
  },
  {
    key: "backgroundLocation",
    icon: MapPinned,
    title: "Background Location",
    description: "We require background location for accurate rider location updates and geofence detection",
  },
];

export default function PermissionsRequiredScreen() {
  const router = useRouter();
  const { permissions, setPermission, completePermissionOnboarding, allPermissionsGranted, phoneNumber } = useAuth();
  const { requestPermission, requestBackgroundPermission, locationPermission, backgroundLocationPermission } = useLocation();
  const [selectedPermission, setSelectedPermission] = useState<keyof PermissionsState | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset all permissions to "pending" when screen loads to ensure cards start white
  useEffect(() => {
    if (!hasInitialized) {
      const resetPermissions = async () => {
        const permissionKeys: (keyof PermissionsState)[] = [
          "pushNotifications",
          "camera",
          "battery",
          "location",
          "backgroundLocation",
        ];
        
        for (const key of permissionKeys) {
          await setPermission(key, "pending");
        }
        setHasInitialized(true);
      };
      resetPermissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePermissionPress = (key: keyof PermissionsState) => {
    setSelectedPermission(key);
  };

  const handleAllow = async () => {
    if (selectedPermission) {
      // For push notifications, actually request the permission
      if (selectedPermission === "pushNotifications") {
        // Check if running in Expo Go (push notifications not supported in Expo Go SDK 53+)
        const isExpoGo =
          typeof Constants !== 'undefined' &&
          Constants?.executionEnvironment === 'storeClient';

        // In Expo Go or web, mark as allowed to allow user to proceed
        if (Platform.OS === 'web' || isExpoGo) {
          await setPermission(selectedPermission, "allowed");
          setSelectedPermission(null);
          return;
        }

        try {
          const granted = await requestNotificationPermissions();
          if (granted) {
            // Register for push notifications and get token
            const token = await registerForPushNotifications();
            if (token) {
              // Send token to backend if phone number is available
              await sendTokenToBackend(token, phoneNumber || undefined);
            }
            await setPermission(selectedPermission, "allowed");
          } else {
            await setPermission(selectedPermission, "denied");
          }
        } catch (error) {
          if (__DEV__) {
            console.error("Error requesting notification permissions:", error);
          }
          // On web, allow to proceed even if there's an error
          if (Platform.OS === 'web') {
            await setPermission(selectedPermission, "allowed");
          } else {
            await setPermission(selectedPermission, "denied");
          }
        }
      } else if (selectedPermission === "location") {
        // Request real location permission
        try {
          const granted = await requestPermission();
          if (granted) {
            await setPermission(selectedPermission, "allowed");
          } else {
            await setPermission(selectedPermission, "denied");
            Alert.alert(
              "Location Permission Denied",
              "Location permission is required to connect you to nearby Stores. Please enable it in your device settings.",
              [{ text: "OK" }]
            );
          }
        } catch (error) {
          if (__DEV__) {
            console.error("Error requesting location permission:", error);
          }
          await setPermission(selectedPermission, "denied");
        }
      } else if (selectedPermission === "backgroundLocation") {
        // Request real background location permission
        try {
          // First ensure foreground location is granted
          if (locationPermission !== 'granted') {
            const foregroundGranted = await requestPermission();
            if (!foregroundGranted) {
              Alert.alert(
                "Location Permission Required",
                "Foreground location permission must be granted before requesting background location.",
                [{ text: "OK" }]
              );
              await setPermission(selectedPermission, "denied");
              setSelectedPermission(null);
              return;
            }
          }

          const granted = await requestBackgroundPermission();
          if (granted) {
            await setPermission(selectedPermission, "allowed");
          } else {
            await setPermission(selectedPermission, "denied");
            Alert.alert(
              "Background Location Permission Denied",
              "Background location permission is required for accurate rider location updates. Please enable it in your device settings.",
              [{ text: "OK" }]
            );
          }
        } catch (error) {
          if (__DEV__) {
            console.error("Error requesting background location permission:", error);
          }
          await setPermission(selectedPermission, "denied");
        }
      } else {
        // For other permissions (camera, battery), just set the status
        await setPermission(selectedPermission, "allowed");
      }
      setSelectedPermission(null);
    }
  };

  const handleDontAllow = () => {
    if (selectedPermission) {
      setPermission(selectedPermission, "denied");
      setSelectedPermission(null);
    }
  };

  const handleProceed = async () => {
    if (allPermissionsGranted()) {
      await completePermissionOnboarding();
      router.replace("/login");
    }
  };

  const canProceed = allPermissionsGranted();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Bell color="#FFFFFF" size={48} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Permissions Required</Text>
          <Text style={styles.subtitle}>Grant the required access to continue using the App</Text>
        </View>

        <View style={styles.permissionsList}>
          {PERMISSIONS_LIST.map((permission) => (
            <PermissionCard
              key={permission.key}
              icon={permission.icon}
              title={permission.title}
              description={permission.description}
              status={permissions[permission.key]}
              onPress={() => handlePermissionPress(permission.key)}
            />
          ))}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {canProceed && (
        <View style={styles.buttonContainer}>
          <PrimaryButton title="Proceed" onPress={handleProceed} />
        </View>
      )}

      {selectedPermission && (
        <PermissionModal
          visible={!!selectedPermission}
          permissionKey={selectedPermission}
          onAllow={handleAllow}
          onDontAllow={handleDontAllow}
        />
      )}
    </View>
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
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing['7xl'],
  },
  header: {
    alignItems: "center",
    paddingTop: Spacing.headerTop,
    paddingBottom: Spacing['4xl'],
  },
  iconContainer: {
    width: Spacing['7xl'],
    height: Spacing['7xl'],
    borderRadius: BorderRadius['2xl-lg'],
    backgroundColor: Colors.primary[650],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing['2xl'],
    ...(Platform.OS === 'web' 
      ? { boxShadow: `0px ${Spacing.sm}px ${Spacing.lg}px rgba(91, 78, 255, 0.3)`, elevation: 8 }
      : { shadowColor: Colors.primary[650], shadowOffset: { width: 0, height: Spacing.sm }, shadowOpacity: 0.3, shadowRadius: Spacing.lg, elevation: 8 }
    ),
  },
  title: {
    fontSize: Typography.fontSize['4xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    letterSpacing: Typography.letterSpacing.tight,
  },
  subtitle: {
    fontSize: Typography.fontSize['md-lg'],
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: Typography.lineHeight.normal * Typography.fontSize['md-lg'],
    paddingHorizontal: Spacing.xl,
  },
  permissionsList: {
    gap: 0,
  },
  spacer: {
    height: Spacing.xl,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.1)', elevation: 8 }
      : { ...Shadows.lg, shadowOffset: { width: 0, height: -4 }, elevation: 8 }
    ),
  },
});
