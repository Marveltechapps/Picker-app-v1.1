import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Dimensions, ScrollView, Alert, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LogOut, Building2, Store, MapPin, Navigation, ChevronLeft } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { useLocation } from "@/state/locationContext";
import { setLocationTypeApi } from "@/services/user.service";
import PrimaryButton from "@/components/PrimaryButton";
import LocationMapView from "@/components/LocationMapView";
import ExitConfirmModal from "@/components/ExitConfirmModal";

const { height } = Dimensions.get("window");

export default function LocationTypeScreen() {
  const router = useRouter();
  const { locationType, setLocationType, logout } = useAuth();
  const { 
    currentLocation, 
    address, 
    refreshLocation, 
    getFormattedAddress,
    locationPermission,
    isLoading: locationLoading,
    startWatchingLocation,
    stopWatchingLocation
  } = useLocation();
  const [selectedType, setSelectedType] = useState<"warehouse" | "darkstore" | null>(locationType as "warehouse" | "darkstore" | null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);

  // Fetch location on mount and start watching for real-time updates
  useEffect(() => {
    if (locationPermission === 'granted') {
      refreshLocation();
      startWatchingLocation();
    }
    return () => {
      stopWatchingLocation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationPermission]);

  const handleLogout = () => setExitModalVisible(true);

  const handleExitConfirm = async () => {
    try {
      setExitLoading(true);
      await logout();
      setExitModalVisible(false);
      router.replace("/login");
    } catch {
      setExitLoading(false);
      setExitModalVisible(false);
      Alert.alert("Error", "Failed to logout. Please try again.");
    } finally {
      setExitLoading(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedType) return;
    setLoading(true);
    try {
      const result = await setLocationTypeApi(selectedType);
      if (result.success) await setLocationType(selectedType);
      setLoading(false);
      router.push("/shift-selection");
    } catch {
      setLoading(false);
      await setLocationType(selectedType);
      router.push("/shift-selection");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.mapBackground}>
        <LocationMapView 
          style={styles.mapView}
          showUserLocation={true}
          showsMyLocationButton={false}
        />
        <View style={styles.mapOverlay} />
        
        <View style={styles.locationMarker}>
          <View style={styles.markerCircle}>
            <MapPin color="#6366F1" size={24} strokeWidth={2.5} fill="#6366F1" />
          </View>
          <View style={styles.locationLabel}>
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocation ? getFormattedAddress() : 'Fetching location...'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/training");
              }
            } catch (error) {
              // Silently handle navigation error
              try {
                router.push("/training");
              } catch {
                // Fallback failed
              }
            }
          }}
        >
          <ChevronLeft color="#111827" size={28} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Location</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <LogOut color="#6B7280" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Your Work Location</Text>
          <Text style={styles.subtitle}>Choose where you&apos;ll be working today</Text>
        </View>

        <View style={styles.nearestCard}>
          <View style={styles.nearestIcon}>
            <Navigation color="#6366F1" size={20} strokeWidth={2} />
          </View>
          <View style={styles.nearestInfo}>
            <Text style={styles.nearestTitle}>Nearest Location</Text>
            <Text style={styles.nearestLocation} numberOfLines={2}>
              {currentLocation ? getFormattedAddress() : 'Location not available'}
            </Text>
          </View>
          <View style={styles.travelInfo}>
            <Text style={styles.travelLabel}>GPS Status</Text>
            <Text style={styles.travelTime}>
              {locationLoading ? 'Loading...' : currentLocation ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={[
              styles.locationCard,
              selectedType === "warehouse" && styles.locationCardSelected,
            ]}
            onPress={() => setSelectedType("warehouse")}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              selectedType === "warehouse" && styles.iconContainerSelected
            ]}>
              <Building2 
                color={selectedType === "warehouse" ? "#FFFFFF" : "#6B7280"} 
                size={32} 
                strokeWidth={2}
              />
            </View>
            <Text style={[
              styles.cardTitle,
              selectedType === "warehouse" && styles.cardTitleSelected
            ]}>
              WAREHOUSE
            </Text>
            <Text style={[
              styles.cardSubtitle,
              selectedType === "warehouse" && styles.cardSubtitleSelected
            ]}>
              Large facility
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.locationCard,
              selectedType === "darkstore" && styles.locationCardSelected,
            ]}
            onPress={() => setSelectedType("darkstore")}
            activeOpacity={0.7}
          >
            <View style={[
              styles.iconContainer,
              selectedType === "darkstore" && styles.iconContainerSelected
            ]}>
              <Store 
                color={selectedType === "darkstore" ? "#FFFFFF" : "#6B7280"} 
                size={32} 
                strokeWidth={2}
              />
            </View>
            <Text style={[
              styles.cardTitle,
              selectedType === "darkstore" && styles.cardTitleSelected
            ]}>
              DARKSTORE
            </Text>
            <Text style={[
              styles.cardSubtitle,
              selectedType === "darkstore" && styles.cardSubtitleSelected
            ]}>
              Quick delivery
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
            disabled={!selectedType}
            loading={loading}
          />
        </View>
      </ScrollView>

      <ExitConfirmModal
        visible={exitModalVisible}
        onConfirm={handleExitConfirm}
        onCancel={() => !exitLoading && setExitModalVisible(false)}
        loading={exitLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mapBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    backgroundColor: "#E5E7EB",
    overflow: 'hidden',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    pointerEvents: 'none',
  },
  locationMarker: {
    position: "absolute",
    top: "45%",
    left: "50%",
    transform: [{ translateX: -80 }, { translateY: -60 }],
    alignItems: "center",
  },
  markerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)', elevation: 8 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }
    ),
  },
  locationLabel: {
    marginTop: 12,
    backgroundColor: "#6366F1",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 4 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }
    ),
  },
  locationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 4 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }
    ),
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', elevation: 4 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 }
    ),
  },
  scrollView: {
    flex: 1,
    marginTop: height * 0.20,
  },
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px -4px 12px rgba(0, 0, 0, 0.1)', elevation: 12 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12 }
    ),
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 22,
  },
  nearestCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  nearestIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nearestInfo: {
    flex: 1,
  },
  nearestTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 2,
  },
  nearestLocation: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  travelInfo: {
    alignItems: "flex-end",
  },
  travelLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 2,
  },
  travelTime: {
    fontSize: 16,
    fontWeight: "700",
    color: "#6366F1",
  },
  cardsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  locationCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 180,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  locationCardSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconContainerSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cardTitleSelected: {
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  cardSubtitleSelected: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
});
