import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/state/authContext";
import Header from "@/components/Header";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { CheckCircle2, Edit, Upload } from "lucide-react-native";
import PrimaryButton from "@/components/PrimaryButton";

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { docType } = useLocalSearchParams<{ docType: string }>();
  const { documentUploads } = useAuth();
  
  const docData = docType === "aadhar" 
    ? { 
        title: "Aadhar Card", 
        front: documentUploads.aadhar.front, 
        back: documentUploads.aadhar.back,
        uploadRoute: "/aadhar-upload"
      }
    : { 
        title: "PAN Card", 
        front: documentUploads.pan.front, 
        back: documentUploads.pan.back,
        uploadRoute: "/pan-upload"
      };

  const handleReplaceDocument = () => {
    Alert.alert(
      `Replace ${docData.title}`,
      "Are you sure you want to replace this document? You'll need to upload both front and back sides again.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Replace",
          style: "destructive",
          onPress: () => {
            router.push(docData.uploadRoute);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        title={docData.title}
        onBackPress={() => {
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.push("/my-documents");
            }
          } catch (error) {
            // Silently handle navigation error
            try {
              router.push("/my-documents");
            } catch {
              // Fallback failed
            }
          }
        }}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {docData.front && (
          <View style={styles.imageSection}>
            <View style={styles.imageHeader}>
              <Text style={styles.sectionTitle}>Front Side</Text>
              <View style={styles.verifiedBadge}>
                <CheckCircle2 color={Colors.success[400]} size={20} strokeWidth={2} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: docData.front }} 
                style={styles.documentImage}
                resizeMode="contain"
                onError={() => {
                  if (__DEV__) {
                    console.warn('Failed to load document image:', docData.front);
                  }
                }}
              />
            </View>
          </View>
        )}

        {docData.back && (
          <View style={styles.imageSection}>
            <View style={styles.imageHeader}>
              <Text style={styles.sectionTitle}>Back Side</Text>
              <View style={styles.verifiedBadge}>
                <CheckCircle2 color={Colors.success[400]} size={20} strokeWidth={2} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
            <View style={styles.imageContainer}>
              <Image 
                source={{ uri: docData.back }} 
                style={styles.documentImage}
                resizeMode="contain"
                onError={() => {
                  if (__DEV__) {
                    console.warn('Failed to load document image:', docData.back);
                  }
                }}
              />
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.actionContainer}>
        <PrimaryButton
          title="Replace Document"
          onPress={handleReplaceDocument}
          style={styles.replaceButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  imageSection: {
    marginBottom: Spacing.xl,
  },
  imageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: Colors.success[50],
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.success[600],
  },
  imageContainer: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  documentImage: {
    width: "100%",
    height: 400,
    borderRadius: BorderRadius.md,
  },
  bottomSpacer: {
    height: Spacing.xl,
  },
  actionContainer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing['3xl'],
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    ...Shadows.md,
    elevation: 8,
  },
  replaceButton: {
    backgroundColor: Colors.error[400],
  },
});

