import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo } from "react";
import { View, ActivityIndicator, StyleSheet, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/state/authContext";
import { LanguageProvider } from "@/state/languageContext";
import { ThemeProvider, useTheme } from "@/state/themeContext";
import { ColorsProvider, useColors } from "@/contexts/ColorsContext";
import { LocationProvider } from "@/state/locationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { setupNotificationListeners, getLastNotificationResponse, registerForPushNotifications, sendTokenToBackend, getNotificationPermissionStatus } from "@/utils/notificationService";
import { setupWebErrorSuppression } from "@/utils/webErrorHandler";
import { setupNativeErrorHandling } from "@/utils/nativeErrorHandler";
import Constants from "expo-constants";

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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function RootLayoutNav() {
  const { hasCompletedPermissionOnboarding, hasCompletedLogin, hasCompletedProfile, hasCompletedVerification, hasCompletedDocuments, hasCompletedTraining, hasCompletedSetup, hasCompletedManagerOTP, isLoading, phoneNumber, setNotifications, notifications } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colors = useColors();
  
  const loadingStyles = useMemo(() => StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
  }), [colors.background]);

  // Setup push notifications when user is logged in (native platforms only)
  // Skip in Expo Go as push notifications are not supported
  useEffect(() => {
    // Push notifications are not supported on web
    if (Platform.OS === 'web') {
      return;
    }

    const isExpoGo = Constants.executionEnvironment === 'storeClient';
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

    const isExpoGo = Constants.executionEnvironment === 'storeClient';
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

    const isSplashScreen = segments[0] === "splash";
    
    // Only hide native splash when we're not on the splash screen
    // This allows the custom splash screen to show first
    if (!isSplashScreen) {
      SplashScreen.hideAsync().catch(() => {
        // Silently handle error
      });
    }
    const inAuthFlow = segments[0] === "permissions" || segments[0] === "login" || segments[0] === "otp" || segments[0] === "profile" || segments[0] === "verification" || segments[0] === "documents" || segments[0] === "aadhar-upload" || segments[0] === "pan-upload" || segments[0] === "verification-loading" || segments[0] === "success" || segments[0] === "training" || segments[0] === "training-video" || segments[0] === "location-type" || segments[0] === "shift-selection" || segments[0] === "get-started" || segments[0] === "collect-device";
    const inTabs = segments[0] === "(tabs)";
    // Check if documents is in any segment position - this prevents redirects to home
    const isDocumentsRoute = (segments as string[]).includes("documents");
    const inProfilePages = segments[0] === "personal-information" || segments[0] === "work-history" || segments[0] === "bank-details" || segments[0] === "update-bank-details" || segments[0] === "update-upi-details" || segments[0] === "my-documents" || segments[0] === "document-detail" || segments[0] === "support-settings" || segments[0] === "notifications" || segments[0] === "faqs" || segments[0] === "contact-support" || segments[0] === "terms-conditions" || segments[0] === "privacy-policy" || segments[0] === "training" || segments[0] === "training-video" || segments[0] === "edit-profile" || isDocumentsRoute;

    // Don't redirect if on splash screen - let it handle its own navigation
    if (isSplashScreen) {
      return;
    }

    // Handle index route - it will redirect to splash
    // Don't interfere with that redirect
    if ((segments[0] as string) === "index") {
      return;
    }

    try {
      if (!hasCompletedPermissionOnboarding && !inAuthFlow) {
        router.replace("/permissions");
      } else if (hasCompletedPermissionOnboarding && !hasCompletedLogin && !inAuthFlow && !inTabs) {
        router.replace("/login");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && !hasCompletedProfile && !inAuthFlow && !inTabs) {
        router.replace("/profile");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && !hasCompletedDocuments && !inAuthFlow && !inTabs) {
        router.replace("/documents");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedDocuments && !hasCompletedVerification && !inAuthFlow && !inTabs) {
        router.replace("/verification");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedDocuments && hasCompletedVerification && !hasCompletedTraining && !inAuthFlow && !inTabs) {
        router.replace("/training");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedVerification && hasCompletedDocuments && hasCompletedTraining && !hasCompletedSetup && !inAuthFlow && !inTabs) {
        router.replace("/location-type");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedVerification && hasCompletedDocuments && hasCompletedTraining && hasCompletedSetup && segments[0] !== "get-started" && segments[0] !== "(tabs)" && !inAuthFlow && !inTabs && !inProfilePages && !isDocumentsRoute) {
        router.replace("/get-started");
      } else if (hasCompletedPermissionOnboarding && hasCompletedLogin && hasCompletedProfile && hasCompletedVerification && hasCompletedDocuments && hasCompletedTraining && hasCompletedSetup && segments[0] === "get-started" && !inTabs && !inProfilePages && !isDocumentsRoute) {
        // Allow get-started screen, navigation to tabs will happen from get-started screen
        return;
      }
    } catch (error) {
      // Silently handle navigation errors
    }
  }, [hasCompletedPermissionOnboarding, hasCompletedLogin, hasCompletedProfile, hasCompletedVerification, hasCompletedDocuments, hasCompletedTraining, hasCompletedSetup, hasCompletedManagerOTP, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={loadingStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[650]} />
      </View>
    );
  }

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
  
  // Use useMemo to prevent unnecessary re-renders
  const containerStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: colors.background,
  }), [colors.background]);
  
  return (
    <GestureHandlerRootView style={containerStyle}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  // Error suppression is already set up at module level (runs immediately)
  // This useEffect ensures it's also set up if module-level setup didn't run
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
