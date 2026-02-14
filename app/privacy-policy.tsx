import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";

export default function PrivacyPolicyScreen() {

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Privacy Policy" subtitle="Last updated: Dec 1, 2023" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.sectionText}>
            We collect the following types of information:
          </Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Personal Information:</Text>
            <Text style={styles.subsectionText}>
              Name, email, phone number, address
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Employment Data:</Text>
            <Text style={styles.subsectionText}>
              Employee ID, designation, joining date
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Attendance Records:</Text>
            <Text style={styles.subsectionText}>
              Punch-in/out times, location data
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Performance Metrics:</Text>
            <Text style={styles.subsectionText}>
              On-time arrival, overtime rates
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Financial Information:</Text>
            <Text style={styles.subsectionText}>
              Bank account details for salary processing
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Documents:</Text>
            <Text style={styles.subsectionText}>
              Aadhar, PAN, address proof
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.sectionText}>
            Your information is used for:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Managing attendance and shift schedules</Text>
            <Text style={styles.bulletText}>• Processing salary and leave requests</Text>
            <Text style={styles.bulletText}>• Tracking performance and productivity</Text>
            <Text style={styles.bulletText}>• Compliance with legal and regulatory requirements</Text>
            <Text style={styles.bulletText}>• Improving app functionality and user experience</Text>
            <Text style={styles.bulletText}>• Sending work-related notifications</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Location Data</Text>
          <Text style={styles.sectionText}>
            We collect your location when you punch in/out to verify you are at the
            designated work location. This data is used solely for attendance verification and
            is not shared with third parties.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data Security</Text>
          <Text style={styles.sectionText}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• End-to-end encryption for sensitive data</Text>
            <Text style={styles.bulletText}>• Secure servers with regular security audits</Text>
            <Text style={styles.bulletText}>• Access controls and authentication protocols</Text>
            <Text style={styles.bulletText}>• Regular backups and disaster recovery systems</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Data Sharing</Text>
          <Text style={styles.sectionText}>
            We may share your information with:
          </Text>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Employers:</Text>
            <Text style={styles.subsectionText}>
              Your attendance, performance, and payroll data
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Service Providers:</Text>
            <Text style={styles.subsectionText}>
              Third-party services that help operate the app
            </Text>
          </View>
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Legal Authorities:</Text>
            <Text style={styles.subsectionText}>
              When required for legal process
            </Text>
          </View>
          <Text style={styles.sectionText}>
            We do not sell your personal information to third party companies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Data Retention</Text>
          <Text style={styles.sectionText}>
            We retain your personal data for as long as you are employed and for up to 7 years
            after your employment as required by law. You can request data deletion by
            contacting our Data Protection Officer: dpo@pickerapp.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Your Rights</Text>
          <Text style={styles.sectionText}>
            You have the right to:
          </Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletText}>• Access your personal data</Text>
            <Text style={styles.bulletText}>• Correct inaccurate information</Text>
            <Text style={styles.bulletText}>
              • Request data deletion (subject to legal requirements)
            </Text>
            <Text style={styles.bulletText}>
              • Export your data in a machine-readable format
            </Text>
            <Text style={styles.bulletText}>• Opt-out of non-essential communications</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Cookies & Tracking</Text>
          <Text style={styles.sectionText}>
            We use cookies and similar technologies to enhance your experience, analyze app
            usage, and maintain session security. You can disable cookies in your device settings,
            but this may affect app functionality.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Children&apos;s Privacy</Text>
          <Text style={styles.sectionText}>
            This app is intended for users 18 years and older. We do not knowingly collect
            information from individuals under 18 years old. If we discover we have inadvertently
            collected data from a minor, we will delete it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
          <Text style={styles.sectionText}>
            We may update this privacy policy from time to time. We will notify you of
            changes by email or through in-app notifications. Your continued use constitutes
            acceptance of the updated policy.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Us</Text>
          <Text style={styles.sectionText}>
            For privacy-related questions or to exercise your rights, please contact:
          </Text>
          <View style={styles.contactInfo}>
            <Text style={styles.contactText}>Email: privacy@pickerapp.com</Text>
            <Text style={styles.contactText}>Phone: 1800-123-4567</Text>
            <Text style={styles.contactText}>Data Protection Officer: dpo@pickerapp.com</Text>
          </View>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>🔒</Text>
          <Text style={styles.noticeText}>
            <Text style={styles.noticeTitle}>Your Privacy Matters</Text>
            {"\n"}We are committed to protecting your privacy and handling your data responsibly.
            For questions or concerns, please do not hesitate to contact us.
          </Text>
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
    marginBottom: 8,
  },
  subsection: {
    marginTop: 8,
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#111827",
    marginBottom: 4,
  },
  subsectionText: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#6B7280",
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
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EEF2FF",
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  noticeIcon: {
    fontSize: 24,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400" as const,
    color: "#4B5563",
    lineHeight: 20,
  },
  noticeTitle: {
    fontWeight: "600" as const,
    color: "#111827",
  },
  bottomSpacer: {
    height: 40,
  },
});
