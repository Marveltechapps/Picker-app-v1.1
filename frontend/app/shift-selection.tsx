import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, LogOut, Clock, Package, CircleDollarSign, CheckCircle2, Info } from "lucide-react-native";
import { useAuth, type ShiftSelection } from "@/state/authContext";
import { selectShiftsApi, getAvailableShifts } from "@/services/shifts.service";
import PrimaryButton from "@/components/PrimaryButton";
import ExitConfirmModal from "@/components/ExitConfirmModal";

interface AvailableShift {
  id: string;
  name: string;
  time: string;
  duration: string;
  orders: number;
  basePay: number;
  color: string;
  limitedSpots?: boolean;
  locationType?: string;
}

const FALLBACK_SHIFTS: AvailableShift[] = [
  { id: "s1", name: "Morning", time: "6 AM - 2 PM", duration: "8h", orders: 50, basePay: 800, color: "#4CAF50", locationType: "warehouse" },
  { id: "s2", name: "Evening", time: "2 PM - 10 PM", duration: "8h", orders: 45, basePay: 850, color: "#2196F3", locationType: "warehouse" },
  { id: "s3", name: "Night", time: "10 PM - 6 AM", duration: "8h", orders: 30, basePay: 900, color: "#9C27B0", locationType: "warehouse" },
  { id: "d1", name: "Darkstore AM", time: "8 AM - 4 PM", duration: "8h", orders: 60, basePay: 820, color: "#FF9800", locationType: "darkstore" },
  { id: "d2", name: "Darkstore PM", time: "4 PM - 12 AM", duration: "8h", orders: 55, basePay: 840, color: "#795548", locationType: "darkstore" },
];

export default function ShiftSelectionScreen() {
  const router = useRouter();
  const { selectedShifts, setSelectedShifts, locationType, completeSetup, logout } = useAuth();
  const [localSelectedShifts, setLocalSelectedShifts] = useState<ShiftSelection[]>(selectedShifts);
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const [availableShifts, setAvailableShifts] = useState<AvailableShift[]>([]);
  const [loadingShifts, setLoadingShifts] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    getAvailableShifts()
      .then((list) => {
        if (!cancelled) {
          if (list.length > 0) {
            setAvailableShifts(
              list.map((s) => ({
                id: s.id,
                name: s.name ?? "",
                time: s.time ?? "",
                duration: s.duration ?? "8h",
                orders: s.orders ?? 0,
                basePay: s.basePay ?? 0,
                color: s.color ?? "#6366F1",
                limitedSpots: s.limitedSpots,
                locationType: s.locationType,
              }))
            );
          } else {
            setAvailableShifts(FALLBACK_SHIFTS);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableShifts(FALLBACK_SHIFTS);
      })
      .finally(() => {
        if (!cancelled) setLoadingShifts(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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

  const toggleShift = (shift: AvailableShift) => {
    const isSelected = localSelectedShifts.some(s => s.id === shift.id);
    
    if (isSelected) {
      setLocalSelectedShifts([]);
    } else {
      // Only allow one shift at a time
      setLocalSelectedShifts([{
        id: shift.id,
        name: shift.name,
        time: shift.time,
      }]);
    }
  };

  const handleContinue = async () => {
    if (localSelectedShifts.length !== 1) return;
    setLoading(true);
    try {
      const result = await selectShiftsApi(localSelectedShifts);
      if (!result.success) {
        setLoading(false);
        Alert.alert("Error", result.error ?? "Failed to save shift selection. Please try again.");
        return;
      }
      await setSelectedShifts(localSelectedShifts);
      await completeSetup();
      setLoading(false);
      router.replace("/get-started" as any);
    } catch {
      setLoading(false);
      Alert.alert("Error", "Failed to save shift selection. Please try again.");
    }
  };

  const isShiftSelected = (shiftId: string) => {
    return localSelectedShifts.some(s => s.id === shiftId);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            try {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/location-type");
              }
            } catch (error) {
              // Silently handle navigation error
              try {
                router.push("/location-type");
              } catch {
                // Fallback failed
              }
            }
          }}
        >
          <ChevronLeft color="#111827" size={28} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Shift</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
          <LogOut color="#6B7280" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>Select Your Shift</Text>
          <Text style={styles.subtitle}>
            Downtown Hub {locationType === "darkstore" ? "Darkstore" : "Warehouse"} • Walk-in Available
          </Text>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Info color="#6366F1" size={20} strokeWidth={2} />
          </View>
          <Text style={styles.infoText}>
            Select one shift to continue. You can change your preferences later.
          </Text>
        </View>

        {loadingShifts ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Loading shifts...</Text>
          </View>
        ) : availableShifts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No shifts available</Text>
            <Text style={styles.emptySubtext}>
              There are no shifts available at the moment. Please try again later.
            </Text>
          </View>
        ) : (
        <View style={styles.shiftsContainer}>
          {availableShifts.map((shift) => {
            const isSelected = isShiftSelected(shift.id);
            
            return (
              <TouchableOpacity
                key={shift.id}
                style={[
                  styles.shiftCard,
                  isSelected && styles.shiftCardSelected,
                ]}
                onPress={() => toggleShift(shift)}
                activeOpacity={0.7}
              >
                <View style={styles.shiftHeader}>
                  <View style={[styles.shiftIcon, { backgroundColor: shift.color }]}>
                    <Clock color="#FFFFFF" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={styles.shiftTitleContainer}>
                    <Text style={[styles.shiftName, isSelected && styles.shiftNameSelected]}>
                      {shift.name}
                    </Text>
                    <Text style={[styles.shiftTime, isSelected && styles.shiftTimeSelected]}>
                      {shift.time}
                    </Text>
                    {shift.locationType ? (
                      <Text style={styles.shiftLocationBadge}>
                        {shift.locationType === "darkstore" ? "Darkstore" : "Warehouse"}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[
                    styles.checkboxContainer,
                    isSelected && styles.checkboxContainerSelected
                  ]}>
                    {isSelected && (
                      <CheckCircle2 color="#6366F1" size={24} strokeWidth={2.5} fill="#6366F1" />
                    )}
                  </View>
                </View>

                <View style={styles.shiftDetails}>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, isSelected && styles.detailLabelSelected]}>
                      Duration
                    </Text>
                    <Text style={[styles.detailValue, isSelected && styles.detailValueSelected]}>
                      {shift.duration}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, isSelected && styles.detailLabelSelected]}>
                      Orders
                    </Text>
                    <Text style={[styles.detailValue, isSelected && styles.detailValueSelected]}>
                      {shift.orders}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Text style={[styles.detailLabel, isSelected && styles.detailLabelSelected]}>
                      Base Pay
                    </Text>
                    <Text style={[styles.detailValue, isSelected && styles.detailValueSelected]}>
                      ₹{shift.basePay}
                    </Text>
                  </View>
                </View>

              </TouchableOpacity>
            );
          })}
        </View>
        )}

        <View style={styles.walkinCard}>
          <View style={styles.walkinIcon}>
            <Package color="#3B82F6" size={20} strokeWidth={2} />
          </View>
          <View style={styles.walkinContent}>
            <Text style={styles.walkinTitle}>Walk-in Flexibility</Text>
            <Text style={styles.walkinText}>
              You can arrive up to 15 minutes before or after shift start time. Payment calculated based on actual hours worked.
            </Text>
          </View>
        </View>

        {localSelectedShifts.length === 1 && (
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationHeader}>
              <CircleDollarSign color="#10B981" size={24} strokeWidth={2} />
              <Text style={styles.confirmationTitle}>CONFIRM SHIFT</Text>
            </View>
            <Text style={styles.confirmationSubtitle}>
              {localSelectedShifts[0].name} • {localSelectedShifts[0].time}
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={localSelectedShifts.length === 1 ? "Confirm Shift" : "Select a Shift"}
          onPress={handleContinue}
          disabled={localSelectedShifts.length !== 1}
          loading={loading}
        />
      </View>

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
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
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
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E0E7FF",
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: "#4F46E5",
    lineHeight: 18,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    textAlign: "center",
  },
  shiftsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  shiftCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  shiftCardSelected: {
    borderColor: "#6366F1",
    backgroundColor: "#F5F3FF",
  },
  shiftHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  shiftIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  shiftTitleContainer: {
    flex: 1,
  },
  shiftName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 2,
  },
  shiftNameSelected: {
    color: "#4F46E5",
  },
  shiftTime: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
  },
  shiftTimeSelected: {
    color: "#6366F1",
  },
  shiftLocationBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    textTransform: "capitalize",
  },
  checkboxContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxContainerSelected: {
    borderColor: "transparent",
  },
  shiftDetails: {
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    gap: 20,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#9CA3AF",
    marginBottom: 4,
  },
  detailLabelSelected: {
    color: "#818CF8",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  detailValueSelected: {
    color: "#4F46E5",
  },
  limitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  limitedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F97316",
    marginRight: 8,
  },
  limitedText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#F97316",
  },
  walkinCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBEAFE",
  },
  walkinIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  walkinContent: {
    flex: 1,
  },
  walkinTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 4,
  },
  walkinText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#3B82F6",
    lineHeight: 18,
  },
  confirmationCard: {
    backgroundColor: "#F0FDF4",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#D1FAE5",
  },
  confirmationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  confirmationSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
  },
  bottomSpacer: {
    height: 100,
  },
  buttonContainer: {
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
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px -2px 8px rgba(0, 0, 0, 0.05)', elevation: 8 }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 8 }
    ),
  },
});
