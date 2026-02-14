import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  User,
  Clock,
  CreditCard,
  FileText,
  Settings,
  BookOpen,
  ChevronRight,
  LogOut,
  Briefcase,
  AlertCircle,
} from "lucide-react-native";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import { useRouter } from "expo-router";
import { Colors, Typography, Spacing, BorderRadius, Shadows, IconSizes } from "@/config/theme";
import { useAuth } from "@/state/authContext";
import { getProfileApi } from "@/services/user.service";

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  try {
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  } catch {
    return "—";
  }
}

function countVerifiedDocuments(uploads: { aadhar: { front: string | null; back: string | null }; pan: { front: string | null; back: string | null } }): number {
  let n = 0;
  if (uploads?.aadhar?.front) n += 1;
  if (uploads?.aadhar?.back) n += 1;
  if (uploads?.pan?.front) n += 1;
  if (uploads?.pan?.back) n += 1;
  return n;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, documentUploads, unreadCount, userProfile, phoneNumber, updateProfile } = useAuth();
  const verifiedCount = countVerifiedDocuments(documentUploads);
  const displayName = userProfile?.name?.trim() || "User";
  const displayId = phoneNumber ? phoneNumber.slice(-6) : "------";
  const memberSince = formatMemberSince(userProfile?.createdAt);
  const documentsSubtitle = verifiedCount > 0 ? `${verifiedCount} verified` : "Documents";

  // Refresh profile from API so Member Since (createdAt) is available
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getProfileApi();
        if (cancelled || !data) return;
        const merged = {
          name: data.name?.trim() || userProfile?.name?.trim() || "User",
          age: typeof data.age === "number" ? data.age : (userProfile?.age ?? 0),
          gender: (data.gender === "female" ? "female" : "male") as "male" | "female",
          photoUri: data.photoUri || userProfile?.photoUri || "",
          email: data.email || userProfile?.email,
          createdAt: data.createdAt || userProfile?.createdAt,
        };
        await updateProfile(merged);
      } catch {
        // Non-blocking: keep existing profile
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleMenuPress = (title: string) => {
    if (title === "Personal Information") {
      router.push("/personal-information");
    } else if (title === "Work History") {
      router.push("/work-history");
    } else if (title === "Bank Account") {
      router.push("/bank-details" as any);
    } else if (title === "Documents") {
      // Navigate to view-only documents screen in profile section
      router.push("/my-documents");
    } else if (title === "Support & Settings") {
      router.push("/support-settings" as any);
    } else if (title === "Training") {
      router.push("/training" as any);
    }
  };

  const handleLogoutPress = () => {
    setLogoutModalVisible(true);
  };

  const handleLogoutConfirm = async () => {
    setLogoutLoading(true);
    try {
      await logout();
      setLogoutModalVisible(false);
      router.replace("/login");
    } catch {
      setLogoutModalVisible(false);
      setErrorModalVisible(true);
    } finally {
      setLogoutLoading(false);
    }
  };

  const menuItems = [
    {
      icon: User,
      title: "Personal Information",
      subtitle: "Contact details & location",
      bgColor: "#EEF2FF",
      iconColor: "#8B5CF6",
    },
    {
      icon: Clock,
      title: "Work History",
      subtitle: "View attendance & shift records",
      bgColor: "#DCFCE7",
      iconColor: "#10B981",
    },
    {
      icon: CreditCard,
      title: "Bank Account",
      subtitle: "Payout account details",
      bgColor: "#FEF3C7",
      iconColor: "#FACC15",
    },
    {
      icon: FileText,
      title: "Documents",
      subtitle: documentsSubtitle,
      bgColor: "#FFEDD5",
      iconColor: "#F97316",
    },
    {
      icon: Settings,
      title: "Support & Settings",
      subtitle: "Help, preferences & app settings",
      bgColor: "#FEE2E2",
      iconColor: "#EF4444",
    },
    {
      icon: BookOpen,
      title: "Training",
      subtitle: "Complete your onboarding",
      bgColor: "#FEF3C7",
      iconColor: "#FACC15",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account</Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
          <Bell color={Colors.text.primary} size={IconSizes.md} strokeWidth={2} />
          {unreadCount > 0 && <View style={styles.notificationDot} />}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {userProfile?.photoUri ? (
              <Image source={{ uri: userProfile.photoUri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <User size={40} color={Colors.text.tertiary} strokeWidth={2} />
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{displayName}</Text>
              <Text style={styles.profileId}>ID: {displayId}</Text>
              <View style={styles.roleBadge}>
                <Briefcase color="#FFFFFF" size={14} strokeWidth={2} />
                <Text style={styles.roleText}>Warehouse Picker</Text>
              </View>
            </View>
          </View>
          <View style={styles.memberSince}>
            <Text style={styles.memberSinceLabel}>Member Since</Text>
            <Text style={styles.memberSinceValue}>{memberSince}</Text>
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleMenuPress(item.title)}
            >
              <View style={[styles.menuIconWrapper, { backgroundColor: item.bgColor }]}>
                <item.icon color={item.iconColor} size={IconSizes.lg} strokeWidth={2} />
              </View>
              <View style={styles.menuTextContainer}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <ChevronRight color={Colors.text.tertiary} size={IconSizes.lg} strokeWidth={2} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.7} onPress={handleLogoutPress}>
          <LogOut color={Colors.error[400]} size={IconSizes.md} strokeWidth={2} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <ExitConfirmModal
        visible={logoutModalVisible}
        onConfirm={handleLogoutConfirm}
        onCancel={() => !logoutLoading && setLogoutModalVisible(false)}
        loading={logoutLoading}
      />

      {/* Error modal */}
      <Modal visible={errorModalVisible} transparent animationType="fade" onRequestClose={() => setErrorModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={() => setErrorModalVisible(false)} />
          <View style={styles.logoutModalCard}>
            <View style={[styles.logoutModalIconWrap, styles.logoutModalIconError]}>
              <AlertCircle color={Colors.error[400]} size={40} strokeWidth={2} />
            </View>
            <Text style={styles.logoutModalTitle}>Error</Text>
            <Text style={styles.logoutModalMessage}>Failed to logout. Please try again.</Text>
            <TouchableOpacity style={styles.logoutModalOkButton} onPress={() => setErrorModalVisible(false)} activeOpacity={0.85}>
              <Text style={styles.logoutModalOkButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    marginTop: Spacing['3xl'],
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    marginTop: Spacing.xs / 2,
  },
  notificationButton: {
    width: Spacing.iconButton,
    height: Spacing.iconButton,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: Spacing['sm-md'],
    right: Spacing['sm-md'],
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: Colors.error[400],
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  profileCard: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.xl,
    padding: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 3,
    borderColor: Colors.white,
    marginRight: Spacing.lg,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.text.tertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    justifyContent: "center",
  },
  profileName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  profileId: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.accent.purple,
    marginBottom: Spacing.md,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing['xs-sm'],
    borderRadius: BorderRadius.sm,
    gap: Spacing['xs-sm'],
  },
  roleText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.white,
  },
  memberSince: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.2)",
    paddingTop: Spacing.lg,
  },
  memberSinceLabel: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.accent.purple,
    marginBottom: Spacing.xs,
  },
  memberSinceValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
  },
  menuContainer: {
    gap: Spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  menuIconWrapper: {
    width: Spacing['5xl'],
    height: Spacing['5xl'],
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs / 2,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.tertiary,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    marginTop: Spacing['2xl'],
    gap: Spacing.sm,
  },
  logoutText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.error[400],
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  logoutModalCard: {
    backgroundColor: Colors.white,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    ...(Platform.OS === "web"
      ? { boxShadow: "0 20px 40px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(139, 92, 246, 0.08)" }
      : { shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 24, elevation: 12 }),
  },
  logoutModalIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.error[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  logoutModalIconError: {
    backgroundColor: Colors.error[50],
  },
  logoutModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  logoutModalMessage: {
    fontSize: 15,
    fontWeight: "400" as const,
    color: Colors.text.secondary,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  logoutModalButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 12,
  },
  logoutModalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutModalBtnCancel: {
    backgroundColor: Colors.gray[100],
  },
  logoutModalBtnConfirm: {
    backgroundColor: Colors.error[400],
  },
  logoutModalBtnPressed: {
    opacity: 0.85,
  },
  logoutModalBtnCancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.text.primary,
  },
  logoutModalBtnConfirmText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
  logoutModalOkButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 40,
    minWidth: 120,
    alignItems: "center",
  },
  logoutModalOkButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.white,
  },
});
