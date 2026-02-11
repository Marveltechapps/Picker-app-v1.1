/** Set true to bypass all providers and render only HELLO (isolation test for Expo Go). */
const __MINIMAL_STARTUP_UI__ = false;
import "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useState } from "react";
import { View, ActivityIndicator, StyleSheet, Platform, Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/state/authContext";
import { LanguageProvider } from "@/state/languageContext";
import { ThemeProvider } from "@/state/themeContext";
import { ColorsProvider, useColors } from "@/contexts/ColorsContext";
import { LocationProvider } from "@/state/locationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupNotificationListeners, getLastNotificationResponse, registerForPushNotifications, sendTokenToBackend, getNotificationPermissionStatus } from "@/utils/notificationService";
import { setupWebErrorSuppression } from "@/utils/webErrorHandler";
import { setupNativeErrorHandling } from "@/utils/nativeErrorHandler";
import Constants from "expo-constants";
console.log("[STARTUP] 2 _layout.tsx: imports done");

// Setup native error handling IMMEDIATELY (before any other code runs)
// This catches unhandled promise rejections and native module crashes.
// Wrapped in try-catch so Expo Go never crashes if ErrorUtils is missing.
if (Platform.OS !== 'web') {
  try {
    setupNativeErrorHandling();
  } catch (e) {
    if (__DEV__) {
      console.warn('[App] Native error handler setup failed (safe to ignore in Expo Go):', e);
    }
  }
}

// Setup web error suppression IMMEDIATELY (before any other code runs)
if (typeof window !== 'undefined') {
  setupWebErrorSuppression();
}

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Minimum time to keep native splash visible (ms). Must match splash.tsx for consistent 3–4s display. */
const NATIVE_SPLASH_MIN_MS = 3500;

console.log("[STARTUP] 3 _layout.tsx: module-level code done");

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutNav() {
  console.log("[STARTUP] 5 RootLayoutNav: render start");
  const { hasCompletedPermissionOnboarding, hasCompletedLogin, hasCompletedProfile, hasCompletedVerification, hasCompletedDocuments, hasCompletedTraining, hasCompletedSetup, hasCompletedManagerOTP, isLoading, phoneNumber, setNotifications, notifications } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();
  const [splashMinTimeReached, setSplashMinTimeReached] = useState(false);
  console.log("[STARTUP] 5b RootLayoutNav: hooks done, isLoading=", isLoading, "segments=", segments);
  const isExpoGo = Boolean(typeof Constants !== "undefined" && Constants?.executionEnvironment === "storeClient");

  // Keep native splash visible for at least NATIVE_SPLASH_MIN_MS before allowing hide anywhere
  useEffect(() => {
    const t = setTimeout(() => setSplashMinTimeReached(true), NATIVE_SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);
  // In Expo Go, ensure loading/root never use a dark background so we never show a black screen.
  const loadingBg = isExpoGo ? "#F9FAFB" : (colors?.background ?? "#F9FAFB");

  const loadingStyles = useMemo(() => StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: loadingBg,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors?.text?.secondary ?? "#6B7280",
    },
  }), [loadingBg, colors?.text?.secondary]);

  // Setup push notifications when user is logged in (native platforms only)
  // Skip in Expo Go as push notifications are not supported
  useEffect(() => {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    const isExpoGo = typeof Constants !== "undefined" && Constants?.executionEnvironment === "storeClient";
    if (isExpoGo) return;

    const setupPushNotifications = async () => {
      try {
        // Only setup if user has completed login and permission onboarding
        if (!hasCompletedPermissionOnboarding || !hasCompletedLogin) {
          return;
        }

        // Check if notifications are allowed
        const permissionStatus = await getNotificationPermissionStatus();
        if (permissionStatus !== 'granted') {
          if (__DEV__) {
            console.log('Push notifications: Permission not granted, status:', permissionStatus);
          }
          return;
        }

        // Register for push notifications
        const token = await registerForPushNotifications();
        if (token) {
          if (__DEV__) {
            console.log('Push notifications: Token registered successfully');
          }
          if (phoneNumber) {
            // Send token to backend
            const backendSuccess = await sendTokenToBackend(token, phoneNumber);
            if (__DEV__) {
              console.log('Push notifications: Token sent to backend:', backendSuccess);
            }
          }
        } else {
          if (__DEV__) {
            console.warn('Push notifications: Failed to register token');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error setting up push notifications:', error);
        }
      }
    };

    setupPushNotifications();
  }, [hasCompletedPermissionOnboarding, hasCompletedLogin, phoneNumber]);

  // Setup notification listeners (native platforms only)
  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    const isExpoGo = typeof Constants !== "undefined" && Constants?.executionEnvironment === "storeClient";
    if (isExpoGo) return;

    // Setup listeners for foreground and background notifications
    const cleanup = setupNotificationListeners(
      // Notification received (foreground)
      (notification) => {
        try {
          const data = notification.request.content.data;
          const title = notification.request.content.title || 'Notification';
          const body = notification.request.content.body || '';
          
          // Add notification to state using functional update
          setNotifications((prevNotifications) => {
            const newNotification = {
              id: notification.request.identifier || Date.now().toString(),
              type: (data?.type as any) || 'update',
              title: typeof title === 'string' ? title : 'Notification',
              description: typeof body === 'string' ? body : '',
              timestamp: new Date().toISOString(),
              isRead: false,
            };
            // Avoid duplicates
            const exists = prevNotifications.some(n => n.id === newNotification.id);
            return exists ? prevNotifications : [newNotification, ...prevNotifications];
          });
        } catch (error) {
          if (__DEV__) {
            console.error('Error handling notification:', error);
          }
        }
      },
      // Notification tapped
      (response) => {
        try {
          const data = response.notification.request.content.data;
          
          // Navigate based on notification type
          if (data?.type === 'order') {
            router.push('/(tabs)');
          } else if (data?.type === 'payout') {
            router.push('/(tabs)/payouts');
          } else if (data?.type === 'shift') {
            router.push('/(tabs)/attendance');
          } else {
            router.push('/notifications');
          }
        } catch (error) {
          console.error('Error handling notification tap:', error);
        }
      }
    );

    // Check if app was opened from a notification (native platforms only)
    // Skip in Expo Go
    if (Platform.OS !== 'web' && !isExpoGo) {
      getLastNotificationResponse().then((response) => {
        if (response) {
          try {
            const data = response.notification.request.content.data;
            if (data?.type === 'order') {
              router.push('/(tabs)');
            } else if (data?.type === 'payout') {
              router.push('/(tabs)/payouts');
            } else if (data?.type === 'shift') {
              router.push('/(tabs)/attendance');
            } else {
              router.push('/notifications');
            }
          } catch (error) {
            if (__DEV__) {
              console.error('Error handling last notification response:', error);
            }
          }
        }
      }).catch(() => {
        // Silently handle errors (method not available on web)
      });
    }

    return cleanup;
  }, [isLoading, router, setNotifications]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const seg0 = segments?.[0];
    const isSplashScreen = seg0 === "splash";
    
    // Only hide native splash when min display time has passed and we're not on the splash screen
    if (splashMinTimeReached && !isSplashScreen) {
      SplashScreen.hideAsync().catch(() => {});
    }
    const inAuthFlow = seg0 === "permissions" || seg0 === "login" || seg0 === "otp" || seg0 === "profile" || seg0 === "verification" || seg0 === "documents" || seg0 === "aadhar-upload" || seg0 === "pan-upload" || seg0 === "verification-loading" || seg0 === "success" || seg0 === "training" || seg0 === "training-video" || seg0 === "location-type" || seg0 === "shift-selection" || seg0 === "get-started" || seg0 === "collect-device";
    const inTabs = seg0 === "(tabs)";
    const isDocumentsRoute = (segments ?? []).includes("documents");
    const inProfilePages = seg0 === "personal-information" || seg0 === "work-history" || seg0 === "bank-details" || seg0 === "update-bank-details" || seg0 === "update-upi-details" || seg0 === "my-documents" || seg0 === "document-detail" || seg0 === "support-settings" || seg0 === "notifications" || seg0 === "faqs" || seg0 === "contact-support" || seg0 === "terms-conditions" || seg0 === "privacy-policy" || seg0 === "training" || seg0 === "training-video" || seg0 === "edit-profile" || isDocumentsRoute;

    if (isSplashScreen) return;
    if (seg0 === "index") return;

    try {
      if (router?.replace) {
        if (!hasCompletedPermissionOnboarding && !inAuthFlow) router.replace("/permissions");
        else if (hasCompletedPermissionOnboarding && !hasCompletedLogin && !inAuthFlow && !inTabs) router.replace("/login");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && !hasCompletedProfile && !inAuthFlow && !inTabs) router.replace("/profile");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && !hasCompletedDocuments && !inAuthFlow && !inTabs) router.replace("/documents");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedDocuments && !hasCompletedVerification && !inAuthFlow && !inTabs) router.replace("/verification");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedDocuments && hasCompletedVerification && !hasCompletedTraining && !inAuthFlow && !inTabs) router.replace("/training");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedVerification && hasCompletedDocuments && hasCompletedTraining && !hasCompletedSetup && !inAuthFlow && !inTabs) router.replace("/location-type");
        else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedVerification && hasCompletedDocuments && hasCompletedTraining && hasCompletedSetup && seg0 !== "get-started" && seg0 !== "(tabs)" && !inAuthFlow && !inTabs && !inProfilePages && !isDocumentsRoute) router.replace("/get-started");
      }
    } catch (error) {
      // Silently handle navigation errors
    }
  }, [hasCompletedPermissionOnboarding, hasCompletedLogin, hasCompletedProfile, hasCompletedVerification, hasCompletedDocuments, hasCompletedTraining, hasCompletedSetup, hasCompletedManagerOTP, isLoading, segments, router, splashMinTimeReached]);

  // In Expo Go, never block on auth loading: show Stack immediately so we don't get stuck on white screen.
  const showLoadingUI = isLoading && !isExpoGo;
  if (showLoadingUI) {
    console.log("[STARTUP] 6 showing loading UI");
    if (splashMinTimeReached) SplashScreen.hideAsync().catch(() => {});
    const primaryColor = colors?.primary?.[650] ?? "#5B4EFF";
    return (
      <View style={loadingStyles.loadingContainer}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={[loadingStyles.loadingText, { color: colors?.text?.secondary ?? "#6B7280" }]}>Loading...</Text>
      </View>
    );
  }

  console.log("[STARTUP] 7 rendering Stack");
  if (splashMinTimeReached) SplashScreen.hideAsync().catch(() => {});
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="permissions" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="otp" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="verification" options={{ headerShown: false }} />
      <Stack.Screen name="documents" options={{ headerShown: false }} />
      <Stack.Screen name="aadhar-upload" options={{ headerShown: false }} />
      <Stack.Screen name="pan-upload" options={{ headerShown: false }} />
      <Stack.Screen name="verification-loading" options={{ headerShown: false }} />
      <Stack.Screen name="success" options={{ headerShown: false }} />
      <Stack.Screen name="training" options={{ headerShown: false }} />
      <Stack.Screen name="training-video" options={{ headerShown: false }} />
      <Stack.Screen name="location-type" options={{ headerShown: false }} />
      <Stack.Screen name="shift-selection" options={{ headerShown: false }} />
      <Stack.Screen name="get-started" options={{ headerShown: false }} />
      <Stack.Screen name="collect-device" options={{ headerShown: false }} />
      <Stack.Screen name="personal-information" options={{ headerShown: false }} />
      <Stack.Screen name="work-history" options={{ headerShown: false }} />
      <Stack.Screen name="bank-details" options={{ headerShown: false }} />
      <Stack.Screen name="update-bank-details" options={{ headerShown: false }} />
      <Stack.Screen name="update-upi-details" options={{ headerShown: false }} />
      <Stack.Screen name="document-detail" options={{ headerShown: false }} />
      <Stack.Screen name="my-documents" options={{ headerShown: false }} />
      <Stack.Screen name="support-settings" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="faqs" options={{ headerShown: false }} />
      <Stack.Screen name="contact-support" options={{ headerShown: false }} />
      <Stack.Screen name="terms-conditions" options={{ headerShown: false }} />
      <Stack.Screen name="privacy-policy" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}


function ThemedGestureHandler({ children }: { children: React.ReactNode }) {
  const colors = useColors();
  const isExpoGo = Boolean(typeof Constants !== "undefined" && Constants?.executionEnvironment === "storeClient");
  const containerBg = isExpoGo ? "#F9FAFB" : (colors?.background ?? "#F9FAFB");

  // Use useMemo to prevent unnecessary re-renders
  const containerStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: containerBg,
  }), [containerBg]);
  
  return (
    <GestureHandlerRootView style={containerStyle}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  console.log("[STARTUP] 4 RootLayout: render");
  if (__MINIMAL_STARTUP_UI__) {
    console.log("[STARTUP] 4minimal rendering HELLO only");
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F9FAFB" }}>
        <Text>HELLO</Text>
      </View>
    );
  }
  // Error suppression is already set up at module level (runs immediately)
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setupWebErrorSuppression();
    }
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ColorsProvider>
            <LanguageProvider>
              <LocationProvider>
                <AuthProvider>
                  <ThemedGestureHandler>
                    <RootLayoutNav />
                  </ThemedGestureHandler>
                </AuthProvider>
              </LocationProvider>
            </LanguageProvider>
          </ColorsProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
