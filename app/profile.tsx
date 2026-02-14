import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Animated, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, LogOut, User } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { updateProfileApi } from "@/services/user.service";
import ProfileAvatarUploader from "@/components/ProfileAvatarUploader";
import RadioGroup from "@/components/RadioGroup";
import PrimaryButton from "@/components/PrimaryButton";
import ExitConfirmModal from "@/components/ExitConfirmModal";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function UserProfileScreen() {
  const router = useRouter();
  const { completeProfile, resetAll } = useAuth();
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);

  const handleAgeChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric === "") {
      setAge(numeric);
      return;
    }
    try {
      const ageNum = parseInt(numeric, 10);
      if (!isNaN(ageNum) && ageNum >= 1 && ageNum <= 120) {
        setAge(numeric);
      }
    } catch {
      // Invalid input, ignore
    }
  };

  const handleLogout = () => setExitModalVisible(true);

  const handleExitConfirm = async () => {
    try {
      setExitLoading(true);
      await resetAll();
      setExitModalVisible(false);
      router.replace("/permissions");
    } catch {
      setExitLoading(false);
      setExitModalVisible(false);
    } finally {
      setExitLoading(false);
    }
  };

  const handleContinue = async () => {
    try {
      const ageNum = parseInt(age, 10);
      if (!photoUri || name.length < 2 || isNaN(ageNum) || ageNum < 1 || ageNum > 120 || !gender) return;
      setLoading(true);
      const profilePayload = { name, age: ageNum, gender: gender as "male" | "female", photoUri };
      const apiResult = await updateProfileApi(profilePayload);
      if (!apiResult.success) {
        Alert.alert("Error", apiResult.error || "Failed to save profile. You can try again from Edit Profile.");
      }
      await completeProfile(profilePayload);
      setLoading(false);
      router.replace("/verification");
    } catch (error) {
      setLoading(false);
      const ageNum = parseInt(age, 10);
      if (!isNaN(ageNum) && photoUri && gender) {
        await completeProfile({ name, age: ageNum, gender: gender as "male" | "female", photoUri });
        router.replace("/verification");
      }
    }
  };

  const isValid = (() => {
    try {
      const ageNum = parseInt(age, 10);
      return photoUri !== null && name.length >= 2 && age !== "" && !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120 && gender !== null;
    } catch {
      return false;
    }
  })();

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => {
              try {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  // If no back history, navigate to login instead of replace
                  router.push("/login");
                }
              } catch (error) {
                // Silently handle navigation error
                try {
                  router.push("/login");
                } catch {
                  // Fallback failed
                }
              }
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#111827" size={28} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Complete Profile
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Add your personal information
            </Text>
          </View>
          <TouchableOpacity style={styles.rightButton} onPress={handleLogout}>
            <LogOut color="#6B7280" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <ProfileAvatarUploader 
            photoUri={photoUri}
            onPhotoSelected={setPhotoUri}
          />

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Full Name</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={styles.inputWrapper}>
              <User color="#9CA3AF" size={20} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="John Doe"
                placeholderTextColor="#D1D5DB"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Age</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="25"
              placeholderTextColor="#D1D5DB"
              value={age}
              onChangeText={handleAgeChange}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Gender</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <RadioGroup 
              options={GENDER_OPTIONS}
              selectedValue={gender}
              onSelect={setGender}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Animated.View style={{ opacity: isValid ? 1 : 0.5 }}>
              <PrimaryButton 
                title="Continue" 
                onPress={handleContinue} 
                disabled={!isValid}
                loading={loading}
              />
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      <ExitConfirmModal
        visible={exitModalVisible}
        onConfirm={handleExitConfirm}
        onCancel={() => !exitLoading && setExitModalVisible(false)}
        loading={exitLoading}
      />
    </KeyboardAvoidingView>
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
    flexGrow: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  titleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    marginTop: 4,
  },
  rightButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
  },
  required: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 17,
    fontWeight: "500",
    color: "#111827",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 17,
    fontWeight: "500",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
});
