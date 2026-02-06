import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FileText, Eye, Upload, Edit } from "lucide-react-native";
import { useAuth } from "@/state/authContext";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import Header from "@/components/Header";
import PrimaryButton from "@/components/PrimaryButton";

interface DocumentItem {
  id: string;
  title: string;
  verified: boolean;
}

export default function MyDocumentsScreen() {
  const router = useRouter();
  const canGoBack = router.canGoBack();
  const { documentUploads, resetAll } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);

  const aadharUploaded = documentUploads.aadhar.front !== null && documentUploads.aadhar.back !== null;
  const panUploaded = documentUploads.pan.front !== null && documentUploads.pan.back !== null;

  const documents: DocumentItem[] = [
    {
      id: 'aadhar',
      title: 'Aadhar Card',
      verified: aadharUploaded,
    },
    {
      id: 'pan',
      title: 'PAN Card',
      verified: panUploaded,
    },
  ];

  // Removed unused variables: verifiedCount, bothVerified

  const handleDocumentAction = (docId: string) => {
    if (docId === 'aadhar') {
      if (aadharUploaded) {
        // Show options: View or Update
        Alert.alert(
          "Aadhar Card",
          "What would you like to do?",
          [
            {
              text: "View",
              onPress: () => router.push('/document-detail?docType=aadhar'),
            },
            {
              text: "Update",
              onPress: () => router.push('/aadhar-upload'),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        // Navigate to upload screen
        router.push('/aadhar-upload');
      }
    } else if (docId === 'pan') {
      if (panUploaded) {
        // Show options: View or Update
        Alert.alert(
          "PAN Card",
          "What would you like to do?",
          [
            {
              text: "View",
              onPress: () => router.push('/document-detail?docType=pan'),
            },
            {
              text: "Update",
              onPress: () => router.push('/pan-upload'),
            },
            {
              text: "Cancel",
              style: "cancel",
            },
          ]
        );
      } else {
        // Navigate to upload screen
        router.push('/pan-upload');
      }
    }
  };

  const handleViewDocument = (docId: string) => {
    if (docId === 'aadhar') {
      router.push('/document-detail?docType=aadhar');
    } else if (docId === 'pan') {
      router.push('/document-detail?docType=pan');
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await resetAll();
      setLoading(false);
      router.replace("/permissions");
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to logout. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Header 
        title="Documents"
        subtitle="View your uploaded documents"
        showBack={canGoBack}
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.documentsContainer}>
          {documents.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.documentCard}
              onPress={() => handleDocumentAction(doc.id)}
              activeOpacity={0.7}
            >
              <View style={styles.documentLeft}>
                <View style={styles.iconContainer}>
                  <FileText color={Colors.error[400]} size={28} strokeWidth={2} />
                </View>
                <View style={styles.documentInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.documentTitle}>{doc.title}</Text>
                    {doc.verified && (
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.checkmark}>✓</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.documentDate}>
                    {doc.verified ? "Verified" : "Not uploaded"}
                  </Text>
                </View>
              </View>
              {doc.verified ? (
                <View style={styles.actionButton}>
                  <Eye color={Colors.white} size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>View</Text>
                </View>
              ) : (
                <View style={styles.uploadButton}>
                  <Upload color={Colors.white} size={18} strokeWidth={2} />
                  <Text style={styles.uploadButtonText}>Upload</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.guidelinesContainer}>
          <View style={styles.guidelinesHeader}>
            <FileText color={Colors.text.secondary} size={20} strokeWidth={2} />
            <Text style={styles.guidelinesTitle}>Document Guidelines</Text>
          </View>
          <View style={styles.guidelinesList}>
            <Text style={styles.guidelineText}>Upload clear, readable copies of documents</Text>
            <Text style={styles.guidelineText}>Ensure all details are visible</Text>
            <Text style={styles.guidelineText}>Verification takes 24-48 hours</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
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
    paddingTop: Spacing.xl,
    paddingBottom: 20,
  },
  documentsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  documentLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  documentTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  verifiedBadge: {
    width: Spacing.xl,
    height: Spacing.xl,
    borderRadius: Spacing.xl / 2,
    backgroundColor: Colors.success[400],
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: {
    color: Colors.white,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  documentDate: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing['xs-sm'],
    backgroundColor: Colors.primary[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  actionButtonText: {
    fontSize: Typography.fontSize['md-lg'],
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing['xs-sm'],
    backgroundColor: Colors.success[500],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  uploadButtonText: {
    fontSize: Typography.fontSize['md-lg'],
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
  },
  guidelinesContainer: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  guidelinesTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  guidelinesList: {
    gap: Spacing.sm,
  },
  guidelineText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  bottomSpacer: {
    height: 100,
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
    ...Shadows.md,
    elevation: 8,
  },
});


