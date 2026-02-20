import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, Alert, Platform, RefreshControl, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { LogOut, Zap } from "lucide-react-native";
import { useAuth, type TrainingProgress } from "@/state/authContext";
import { Colors, Typography, Spacing, BorderRadius, Shadows } from "@/config/theme";
import Header from "@/components/Header";
import TrainingVideoCard from "@/components/TrainingVideoCard";
import PrimaryButton from "@/components/PrimaryButton";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import { getTrainingVideos, type TrainingVideo } from "@/services/training.service";

export default function TrainingVideosScreen() {
  const router = useRouter();
  const { trainingProgress, logout, hasCompletedTraining, completeTraining } = useAuth();
  const [loading, setLoading] = React.useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = React.useState<boolean>(false);
  const [exitLoading, setExitLoading] = React.useState<boolean>(false);
  const [videos, setVideos] = useState<TrainingVideo[]>([]);
  const [fetchingVideos, setFetchingVideos] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Fetch videos from backend
  const fetchVideos = async () => {
    try {
      const data = await getTrainingVideos();
      setVideos(data);
    } catch (error) {
      console.error('Failed to fetch training videos:', error);
      Alert.alert('Error', 'Failed to load training videos. Please try again.');
    } finally {
      setFetchingVideos(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchVideos();
    setRefreshing(false);
  };

  const completedCount = videos.filter(v => v.completed).length;
  const allComplete = videos.length > 0 && completedCount === videos.length;

  const handleVideoPress = (video: TrainingVideo) => {
    router.push({
      pathname: "/training-video" as any,
      params: {
        videoId: video.videoId,
        title: video.title,
        duration: video.durationDisplay,
        description: video.description,
        videoUrl: video.videoUrl,
        watchedSeconds: video.watchedSeconds.toString(),
        lastPosition: video.lastWatchedPosition.toString(),
      },
    });
  };

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
    if (allComplete && !hasCompletedTraining) {
      try {
        setLoading(true);
        await completeTraining();
        setLoading(false);
        router.replace("/location-type");
      } catch (error) {
        setLoading(false);
        Alert.alert("Error", "Failed to complete training. Please try again.");
      }
    }
  };

  // New design for users who have completed training (accessed from profile)
  if (hasCompletedTraining) {
    return (
      <View style={styles.container}>
        <Header 
          title="Training Module"
          subtitle="Learn how to work like a Pro"
          showBack={true}
          rightIcon={LogOut}
          onRightPress={handleLogout}
          rightIconColor={Colors.text.secondary}
        />
        {fetchingVideos ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
            <Text style={styles.loadingText}>Loading training videos...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <View style={styles.newVideosSection}>
              {videos.map((video) => (
                <TouchableOpacity
                  key={video.videoId}
                  style={styles.simpleVideoCard}
                  onPress={() => handleVideoPress(video)}
                  activeOpacity={0.7}
                >
                  <View style={styles.simpleCardContent}>
                    <View style={styles.simpleCardTextContainer}>
                      <Text style={styles.simpleCardTitle}>{video.title}</Text>
                      <Text style={styles.simpleCardDuration}>{video.durationDisplay} training video</Text>
                    </View>
                    {video.completed && (
                      <View style={styles.simpleCardBadge}>
                        <Text style={styles.simpleCardBadgeText}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.bottomSpacer} />
          </ScrollView>
        )}

        <ExitConfirmModal
          visible={exitModalVisible}
          onConfirm={handleExitConfirm}
          onCancel={() => !exitLoading && setExitModalVisible(false)}
          loading={exitLoading}
        />
      </View>
    );
  }

  // Original login flow design
  if (fetchingVideos) {
    return (
      <View style={styles.container}>
        <Header 
          title="Training Module"
          subtitle="Learn how to work like a Pro"
          showBack={true}
          rightIcon={LogOut}
          onRightPress={handleLogout}
          rightIconColor={Colors.text.secondary}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={styles.loadingText}>Loading training videos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header 
        title="Training Module"
        subtitle="Learn how to work like a Pro"
        showBack={true}
        rightIcon={LogOut}
        onRightPress={handleLogout}
        rightIconColor={Colors.text.secondary}
      />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >

        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Training Progress</Text>
          <Text style={styles.progressCount}>{completedCount}/{videos.length}</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill,
                { width: `${videos.length > 0 ? (completedCount / videos.length) * 100 : 0}%` }
              ]}
            />
          </View>
        </View>

        <View style={styles.videosSection}>
          {videos.map((video) => (
            <TrainingVideoCard
              key={video.videoId}
              title={video.title}
              duration={video.durationDisplay}
              completed={video.completed}
              onPress={() => handleVideoPress(video)}
            />
          ))}
        </View>

        {allComplete && (
          <View style={styles.congratsCard}>
            <View style={styles.congratsIconContainer}>
              <Zap color="#F59E0B" size={24} strokeWidth={2.5} fill="#F59E0B" />
            </View>
            <View style={styles.congratsTextContainer}>
              <Text style={styles.congratsTitle}>Congratulations! 🎉</Text>
              <Text style={styles.congratsText}>
                You&apos;ve completed all training modules! You&apos;re now ready to start your final assessment.
              </Text>
            </View>
          </View>
        )}

        {!allComplete && (
          <View style={styles.motivationCard}>
            <View style={styles.motivationIconContainer}>
              <Zap color="#F59E0B" size={24} strokeWidth={2.5} fill="#F59E0B" />
            </View>
            <View style={styles.motivationTextContainer}>
              <Text style={styles.motivationTitle}>Keep Going!</Text>
              <Text style={styles.motivationText}>
                Complete all modules to unlock your Picker Certification and start your first shift.
              </Text>
            </View>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={allComplete ? "Start Final Assessment" : `Complete ${videos.length - completedCount} More Module${videos.length - completedCount === 1 ? '' : 's'}`}
          onPress={handleContinue}
          disabled={!allComplete}
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
    backgroundColor: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: Spacing['2xl'],
    paddingHorizontal: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.lg,
  },
  progressCard: {
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing['2xl'],
  },
  progressTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  progressCount: {
    fontSize: Spacing['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  progressBarContainer: {
    height: Spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs,
  },
  videosSection: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  motivationCard: {
    flexDirection: "row",
    backgroundColor: Colors.warning[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.warning[100],
    marginBottom: Spacing['2xl'],
  },
  motivationIconContainer: {
    width: Spacing['5xl'],
    height: Spacing['5xl'],
    borderRadius: Spacing['2xl'],
    backgroundColor: Colors.warning[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  motivationTextContainer: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.warning[700],
    marginBottom: Spacing.xs,
  },
  motivationText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.warning[600],
    lineHeight: Typography.lineHeight.normal * Typography.fontSize.md,
  },
  congratsCard: {
    flexDirection: "row",
    backgroundColor: Colors.success[50],
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.success[200],
    marginBottom: Spacing['2xl'],
  },
  congratsIconContainer: {
    width: Spacing['5xl'],
    height: Spacing['5xl'],
    borderRadius: Spacing['2xl'],
    backgroundColor: Colors.warning[100],
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  congratsTextContainer: {
    flex: 1,
  },
  congratsTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[600],
    marginBottom: Spacing.xs,
  },
  congratsText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.success[500],
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
  simplifiedVideoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...(Platform.OS === 'web' 
      ? { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)', elevation: 2 }
      : { shadowColor: "#000000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 }
    ),
  },
  simplifiedVideoTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  simplifiedVideoDuration: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  // New design styles for profile navigation
  newVideosSection: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  simpleVideoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.medium,
    ...Shadows.md,
  },
  simpleCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  simpleCardTextContainer: {
    flex: 1,
  },
  simpleCardTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing['xs-sm'],
    letterSpacing: Typography.letterSpacing.normal,
  },
  simpleCardDuration: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
  },
  simpleCardBadge: {
    width: Spacing['3xl'],
    height: Spacing['3xl'],
    borderRadius: Spacing.lg,
    backgroundColor: Colors.success[50],
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.success[200],
    marginLeft: Spacing.md,
  },
  simpleCardBadgeText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.success[500],
  },
});
