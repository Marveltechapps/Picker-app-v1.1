import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";

export default function TermsConditionsScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Terms & Conditions" subtitle="Last updated: Dec 1, 2023" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using the Picker App, you accept and agree to be bound by the
            terms and provision of this agreement. If you do not agree to these terms, please do
            not use this application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Use of Service</Text>
          <Text style={styles.sectionText}>
            The Picker App is designed for warehouse and dark store workers to manage their
            attendance, shifts, leaves, and performance. You agree to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Provide accurate and truthful information</Text>
            <Text style={styles.bulletText}>• Maintain the confidentiality of your account credentials</Text>
            <Text style={styles.bulletText}>• Use the app only for legitimate work-related purposes</Text>
            <Text style={styles.bulletText}>• Not attempt to breach security or access unauthorized areas</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Attendance & Time Tracking</Text>
          <Text style={styles.sectionText}>
            You are responsible for accurately recording your work hours through the
            punch-in/out feature. Any discrepancies must be reported to your supervisor
            immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Privacy & Data Collection</Text>
          <Text style={styles.sectionText}>
            We collect and process your personal information including name, contact details,
            attendance records, and performance data. This data is used solely for employment
            purposes and protected according to our Privacy Policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Salary & Payments</Text>
          <Text style={styles.sectionText}>
            Salary information displayed in the app is for reference only. Actual payments are
            processed through the company&apos;s payroll system. Discrepancies should be
            reported to HR.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Leave Policy</Text>
          <Text style={styles.sectionText}>
            Leave requests submitted through the app are subject to approval by your supervisor
            and must comply with company leave policies. Emergency leaves may require
            additional documentation.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Account Suspension</Text>
          <Text style={styles.sectionText}>
            We reserve the right to suspend or terminate your account if:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• You violate these terms</Text>
            <Text style={styles.bulletText}>• Your employment is terminated</Text>
            <Text style={styles.bulletText}>• Suspicious or fraudulent activity is detected</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.sectionText}>
            All content, features, and functionality of the Picker App are owned by the company
            and protected by copyright, trademark, and other intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            The app is provided &quot;as is&quot; without warranties of any kind. We are not liable
            for any indirect, incidental, or consequential damages arising from your use of the
            app.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            We reserve the right to modify these terms at any time. Changes will be effective
            immediately upon posting. Continued use of the app constitutes acceptance of
            updated terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.sectionText}>
            For questions about these terms, please contact:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Email: legal@pickerapp.com</Text>
            <Text style={styles.contactText}>Phone: 1800-123-4567</Text>
            <Text style={styles.contactText}>Address: Bangalore, Karnataka, India</Text>
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
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#111827",
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#4B5563",
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  bulletText: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 4,
  },
  contactInfo: {
    marginTop: 8,
    paddingLeft: 8,
  },
  contactText: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 4,
  },
  bottomSpacer: {
    height: 40,
  },
});
