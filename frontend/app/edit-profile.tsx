import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ChevronLeft, User, Phone, Mail } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { updateProfileApi } from "@/services/user.service";
import ProfileAvatarUploader from "@/components/ProfileAvatarUploader";
import RadioGroup from "@/components/RadioGroup";
import PrimaryButton from "@/components/PrimaryButton";

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { userProfile, updateProfile, phoneNumber } = useAuth();
  const [name, setName] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || "");
      setAge(userProfile.age?.toString() || "");
      setGender(userProfile.gender || null);
      setPhotoUri(userProfile.photoUri || null);
      setEmail(userProfile.email || "");
    }
    if (phoneNumber) {
      setPhone(phoneNumber);
    }
  }, [userProfile, phoneNumber]);

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

  const handlePhoneChange = (text: string) => {
    // Allow digits, spaces, +, and - for phone numbers
    const cleaned = text.replace(/[^\d+\-\s]/g, "");
    setPhone(cleaned);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSave = async () => {
    try {
      const ageNum = parseInt(age, 10);
      
      if (!name.trim() || name.trim().length < 2) {
        try {
          Alert.alert("Validation Error", "Please enter a valid name (at least 2 characters)");
        } catch {
          // Silently handle alert error
        }
        return;
      }

      if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
        try {
          Alert.alert("Validation Error", "Please enter a valid age (1-120)");
        } catch {
          // Silently handle alert error
        }
        return;
      }

      if (!gender) {
        try {
          Alert.alert("Validation Error", "Please select your gender");
        } catch {
          // Silently handle alert error
        }
        return;
      }

      if (!photoUri) {
        try {
          Alert.alert("Validation Error", "Please add a profile photo");
        } catch {
          // Silently handle alert error
        }
        return;
      }

      if (phone.trim()) {
        const digitsOnly = phone.replace(/\D/g, "");
        if (digitsOnly.length < 10) {
          try {
            Alert.alert("Validation Error", "Please enter a valid phone number (at least 10 digits)");
          } catch {
            // Silently handle alert error
          }
          return;
        }
      }

      if (email.trim() && !validateEmail(email.trim())) {
        try {
          Alert.alert("Validation Error", "Please enter a valid email address");
        } catch {
          // Silently handle alert error
        }
        return;
      }

      setLoading(true);
      try {
        const apiResult = await updateProfileApi({
          name: name.trim(),
          age: ageNum,
          gender: gender as "male" | "female",
          photoUri,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        });
        if (!apiResult.success) {
          setLoading(false);
          Alert.alert("Error", apiResult.error || "Failed to update profile. Please try again.");
          return;
        }
        await updateProfile({
          name: name.trim(),
          age: ageNum,
          gender: gender as "male" | "female",
          photoUri,
          email: email.trim() || undefined,
        }, phone.trim() || undefined);

        setLoading(false);
        try {
          Alert.alert(
            "Success",
            "Profile updated successfully",
            [
              {
                text: "OK",
                onPress: () => {
                  try {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.push("/personal-information");
                    }
                  } catch (error) {
                    // Silently handle navigation error
                    try {
                      router.push("/personal-information");
                    } catch {
                      // Fallback failed
                    }
                  }
                },
              },
            ]
          );
        } catch {
          // Silently handle alert error, still navigate back
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/personal-information");
            }
          } catch (error) {
            // Silently handle navigation error
            try {
              router.push("/personal-information");
            } catch {
              // Fallback failed
            }
          }
        }
      } catch (error) {
        setLoading(false);
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        try {
          Alert.alert("Error", `Failed to update profile: ${errorMessage}. Please try again.`);
        } catch {
          // Silently handle alert error
        }
      }
    } catch (error) {
      setLoading(false);
      // Silently handle error
    }
  };

  const isValid = (() => {
    try {
      const ageNum = parseInt(age, 10);
      return name.trim().length >= 2 && age !== "" && !isNaN(ageNum) && ageNum >= 1 && ageNum <= 120 && gender !== null && photoUri !== null;
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
                  router.push("/personal-information");
                }
              } catch (error) {
                // Silently handle navigation error
                try {
                  router.push("/personal-information");
                } catch {
                  // Fallback failed
                }
              }
            }}
          >
            <ChevronLeft color="#111827" size={28} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              Edit Profile
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              Update your personal information
            </Text>
          </View>
          <View style={styles.rightButton} />
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
                style={[styles.inputWithIcon, focusedInput === "name" && styles.inputFocusedBorder]}
                placeholder="John Doe"
                placeholderTextColor="#D1D5DB"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                onFocus={() => setFocusedInput("name")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Age</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              style={[styles.input, focusedInput === "age" && styles.inputFocused]}
              placeholder="25"
              placeholderTextColor="#D1D5DB"
              value={age}
              onChangeText={handleAgeChange}
              keyboardType="number-pad"
              maxLength={3}
              onFocus={() => setFocusedInput("age")}
              onBlur={() => setFocusedInput(null)}
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

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Phone Number</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Phone color="#9CA3AF" size={20} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, focusedInput === "phone" && styles.inputFocusedBorder]}
                placeholder="+91 98765 43210"
                placeholderTextColor="#D1D5DB"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                autoCapitalize="none"
                onFocus={() => setFocusedInput("phone")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.inputSection}>
            <View style={styles.labelContainer}>
              <Text style={styles.label}>Email</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Mail color="#9CA3AF" size={20} strokeWidth={2} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputWithIcon, focusedInput === "email" && styles.inputFocusedBorder]}
                placeholder="john.doe@example.com"
                placeholderTextColor="#D1D5DB"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                onFocus={() => setFocusedInput("email")}
                onBlur={() => setFocusedInput(null)}
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title="Save Changes" 
              onPress={handleSave} 
              disabled={!isValid}
              loading={loading}
            />
          </View>
        </View>
      </ScrollView>
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
    borderWidth: 0,
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
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  inputFocusedBorder: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 17,
    fontWeight: "500",
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputFocused: {
    borderColor: "#3B82F6",
    borderWidth: 2,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
});
