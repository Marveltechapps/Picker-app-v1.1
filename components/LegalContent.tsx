import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import PrimaryButton from "./PrimaryButton";

interface LegalContentProps {
  type: "terms" | "privacy";
  onAccept: () => void;
}

export default function LegalContent({ type, onAccept }: LegalContentProps) {
  const isTerms = type === "terms";

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{isTerms ? "Terms & Conditions" : "Privacy Policy"}</Text>

        {isTerms ? (
          <>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.paragraph}>
              By accessing and using this Picker application, you accept and agree to be bound by the
              terms and provision of this agreement. If you do not agree to these terms, please do not
              use this application.
            </Text>

            <Text style={styles.sectionTitle}>2. Employment Relationship</Text>
            <Text style={styles.paragraph}>
              Your use of this application does not establish an employment relationship. You acknowledge
              that you are an independent contractor and will be responsible for your own taxes and
              compliance with local regulations.
            </Text>

            <Text style={styles.sectionTitle}>3. Work Responsibilities</Text>
            <Text style={styles.paragraph}>As a picker, you agree to:</Text>
            <Text style={styles.listItem}>• Accurately pick and pack orders</Text>
            <Text style={styles.listItem}>• Follow warehouse safety protocols</Text>
            <Text style={styles.listItem}>• Maintain professional conduct</Text>
            <Text style={styles.listItem}>• Protect customer information</Text>
            <Text style={styles.listItem}>• Report to assigned warehouse on time</Text>

            <Text style={styles.sectionTitle}>4. Attendance & Scheduling</Text>
            <Text style={styles.paragraph}>
              You must punch in/out accurately using the app. Unauthorized absences or late arrivals may
              result in penalties or termination from the platform.
            </Text>

            <Text style={styles.sectionTitle}>5. Payment Terms</Text>
            <Text style={styles.paragraph}>
              Payments will be processed based on completed shifts and order incentives. Overtime is
              calculated at 1.25x base rate. Payments are typically processed within 7 business days.
            </Text>

            <Text style={styles.sectionTitle}>6. Termination</Text>
            <Text style={styles.paragraph}>
              Either party may terminate this agreement at any time. Repeated violations of these terms
              may result in immediate account suspension.
            </Text>

            <Text style={styles.sectionTitle}>7. Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We reserve the right to modify these terms at any time. Continued use of the app after
              changes constitutes acceptance of the new terms.
            </Text>

            <Text style={styles.footer}>Last updated: January 8, 2026</Text>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.paragraph}>We collect the following information:</Text>
            <Text style={styles.listItem}>• Personal details (name, phone number, email)</Text>
            <Text style={styles.listItem}>• Identity documents (Aadhaar, PAN)</Text>
            <Text style={styles.listItem}>• Location data (for warehouse assignment)</Text>
            <Text style={styles.listItem}>• Work history and performance metrics</Text>
            <Text style={styles.listItem}>• Attendance and punch in/out times</Text>
            <Text style={styles.listItem}>• Profile photo and selfie verification</Text>

            <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.paragraph}>Your information is used to:</Text>
            <Text style={styles.listItem}>• Verify your identity and eligibility</Text>
            <Text style={styles.listItem}>• Assign you to warehouse locations</Text>
            <Text style={styles.listItem}>• Process payments and incentives</Text>
            <Text style={styles.listItem}>• Track attendance and performance</Text>
            <Text style={styles.listItem}>• Improve app functionality</Text>
            <Text style={styles.listItem}>• Communicate important updates</Text>

            <Text style={styles.sectionTitle}>3. Data Security</Text>
            <Text style={styles.paragraph}>
              We implement industry-standard security measures to protect your personal information. All
              sensitive data is encrypted and stored securely. Access is limited to authorized personnel
              only.
            </Text>

            <Text style={styles.sectionTitle}>4. Data Sharing</Text>
            <Text style={styles.paragraph}>We do not sell your personal information. Data may be shared with:</Text>
            <Text style={styles.listItem}>• Warehouse partners (for work coordination)</Text>
            <Text style={styles.listItem}>• Payment processors (for salary disbursement)</Text>
            <Text style={styles.listItem}>• Legal authorities (when required by law)</Text>

            <Text style={styles.sectionTitle}>5. Location Services</Text>
            <Text style={styles.paragraph}>
              We use your location to assign nearby warehouses and verify attendance. You can disable
              location services, but this may limit app functionality.
            </Text>

            <Text style={styles.sectionTitle}>6. Your Rights</Text>
            <Text style={styles.paragraph}>You have the right to:</Text>
            <Text style={styles.listItem}>• Access your personal data</Text>
            <Text style={styles.listItem}>• Request data corrections</Text>
            <Text style={styles.listItem}>• Delete your account</Text>
            <Text style={styles.listItem}>• Opt-out of non-essential communications</Text>

            <Text style={styles.footer}>Last updated: January 8, 2026</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton title="I Understand" onPress={onAccept} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 20,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    fontWeight: "400",
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 15,
    fontWeight: "400",
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 6,
    paddingLeft: 8,
  },
  footer: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 32,
    marginBottom: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
});
