import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar, Image, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as ExpoSplashScreen from "expo-splash-screen";
import { useAuth } from "@/state/authContext";
import Constants from "expo-constants";

/** Max time to show splash before redirecting with whatever state we have (prevents hang if load never completes). */
const SPLASH_MAX_WAIT_MS = 12000;

export default function SplashScreen() {
  const router = useRouter();
  const auth = useAuth();
  const hasCompletedPermissionOnboarding = auth?.hasCompletedPermissionOnboarding ?? false;
  const hasCompletedLogin = auth?.hasCompletedLogin ?? false;
  const hasCompletedProfile = auth?.hasCompletedProfile ?? false;
  const hasCompletedVerification = auth?.hasCompletedVerification ?? false;
  const hasCompletedDocuments = auth?.hasCompletedDocuments ?? false;
  const hasCompletedTraining = auth?.hasCompletedTraining ?? false;
  const hasCompletedSetup = auth?.hasCompletedSetup ?? false;
  const isLoading = auth?.isLoading ?? true;
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    const hideNativeSplash = async () => {
      try {
        await ExpoSplashScreen.hideAsync();
      } catch (_) {}
    };
    hideNativeSplash();
  }, []);

  // Redirect once auth state is loaded (or max wait). Use persisted state so restart restores correct route.
  useEffect(() => {
    if (hasRedirected) return;

    const redirectWhenReady = () => {
      if (hasRedirected) return;
      setHasRedirected(true);

      try {
        if (!hasCompletedPermissionOnboarding) {
          router.replace("/permissions");
          return;
        }
        if (!hasCompletedLogin) {
          router.replace("/login");
          return;
        }
        if (!hasCompletedProfile) {
          router.replace("/profile");
          return;
        }
        if (!hasCompletedDocuments) {
          router.replace("/documents");
          return;
        }
        if (!hasCompletedVerification) {
          router.replace("/verification");
          return;
        }
        if (!hasCompletedTraining) {
          router.replace("/training");
          return;
        }
        if (!hasCompletedSetup) {
          router.replace("/location-type");
          return;
        }
        router.replace("/get-started");
      } catch (_) {}
    };

    if (!isLoading) {
      redirectWhenReady();
      return;
    }

    const maxWait = setTimeout(() => {
      if (hasRedirected) return;
      if (__DEV__ && typeof Constants !== "undefined" && Constants?.executionEnvironment === "storeClient") {
        console.warn("[Splash] Max wait reached; redirecting with current state (Expo Go).");
      }
      redirectWhenReady();
    }, SPLASH_MAX_WAIT_MS);

    return () => clearTimeout(maxWait);
  }, [
    hasRedirected,
    isLoading,
    hasCompletedPermissionOnboarding,
    hasCompletedLogin,
    hasCompletedProfile,
    hasCompletedDocuments,
    hasCompletedVerification,
    hasCompletedTraining,
    hasCompletedSetup,
    router,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4A3AFF" />
      
      {/* Logo/Icon Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBackground}>
          <Image 
            source={require("@/assets/images/icon.png")} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Text Container */}
      <View style={styles.textContainer}>
        <Text style={styles.heading}>Picker Pro</Text>
        <Text style={styles.tagline}>Scan Fast. Pick Smart.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4A3AFF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    position: "absolute",
    top: "37%", // Approximately 280.75px from top in 757.5px height
    alignItems: "center",
    justifyContent: "center",
  },
  logoBackground: {
    width: 98,
    height: 98,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 8px 10px rgba(0, 0, 0, 0.1)', elevation: 8 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 8 }
    ),
  },
  logo: {
    width: 42,
    height: 42,
  },
  textContainer: {
    position: "absolute",
    bottom: "30%", // Approximately 406.75px from top in 757.5px height
    alignItems: "center",
    gap: 10.5,
  },
  heading: {
    fontSize: 31.5,
    fontWeight: "900",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.79, // -2.5% of 31.5
    lineHeight: 35,
  },
  tagline: {
    fontSize: 15.75,
    fontWeight: "400",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    lineHeight: 24.5,
  },
});

