import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, InteractionManager } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, LogOut, BookOpen } from "lucide-react-native";
import { useVideoPlayer, VideoView } from "expo-video";
import { useAuth, type TrainingProgress } from "@/state/authContext";
import { trackWatchProgress, completeVideo } from "@/services/training.service";
import PrimaryButton from "@/components/PrimaryButton";
import ExitConfirmModal from "@/components/ExitConfirmModal";
import { Shadows } from "@/config/theme";

export default function TrainingVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    videoId: string;
    title: string;
    duration: string;
    description: string;
    videoUrl: string;
    watchedSeconds: string;
    lastPosition: string;
  }>();
  
  const { updateTrainingProgress, trainingProgress, logout } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [exitModalVisible, setExitModalVisible] = useState<boolean>(false);
  const [exitLoading, setExitLoading] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const [totalWatchedSeconds, setTotalWatchedSeconds] = useState<number>(
    params.watchedSeconds ? Number(params.watchedSeconds) : 0
  );
  const lastSyncTimeRef = useRef<number>(Date.now());
  const watchStartTimeRef = useRef<number>(Date.now());

  // Get video URL from params (now comes from backend)
  const videoUrl = params.videoUrl || "";

  const player = useVideoPlayer(videoUrl, (player) => {
    player.loop = false;
    player.muted = false;
    // Resume from last position if available
    if (params.lastPosition && Number(params.lastPosition) > 0) {
      player.currentTime = Number(params.lastPosition);
    }
  });

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      try {
        if (player.playing) player.pause();
      } catch (_) {}
    };
  }, [player]);

  // Check if video is already completed
  useEffect(() => {
    const videoId = params.videoId as keyof TrainingProgress;
    const savedProgress = videoId && videoId in trainingProgress 
      ? trainingProgress[videoId] ?? 0 
      : 0;
    
    if (savedProgress === 100) {
      setIsComplete(true);
      setProgress(100);
    }
  }, [params.videoId, trainingProgress]);

  // Track watch progress and sync to backend
  useEffect(() => {
    const interval = setInterval(async () => {
      if (player.duration > 0 && player.playing) {
        // Update local progress
        const progressPercent = Math.floor((player.currentTime / player.duration) * 100);
        setProgress(progressPercent);
        
        // Track watched time (only when playing)
        const now = Date.now();
        const elapsedSeconds = Math.floor((now - watchStartTimeRef.current) / 1000);
        watchStartTimeRef.current = now;
        setTotalWatchedSeconds(prev => prev + elapsedSeconds);
        
        // Sync to backend every 10 seconds
        if (now - lastSyncTimeRef.current >= 10000 && params.videoId) {
          lastSyncTimeRef.current = now;
          try {
            await trackWatchProgress(
              params.videoId,
              totalWatchedSeconds + elapsedSeconds,
              player.currentTime
            );
          } catch (error) {
            console.warn('[training-video] Failed to sync watch progress:', error);
          }
        }
        
        // Mark as complete when video reaches end
        if (progressPercent >= 99 && !isComplete) {
          setIsComplete(true);
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [player, isComplete, params.videoId, totalWatchedSeconds]);

  const handlePlayPress = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
      watchStartTimeRef.current = Date.now();
    }
  };

  const navigateAfterVideoCleanup = (fn: () => void) => {
    try {
      if (player.playing) player.pause();
    } catch (_) {}
    InteractionManager.runAfterInteractions(() => {
      if (!isMountedRef.current) return;
      try {
        fn();
      } catch {
        try {
          router.push("/training");
        } catch {
          // ignore
        }
      }
    });
  };

  const handleContinue = async () => {
    if (!isComplete || !params.videoId) return;
    setLoading(true);
    
    try {
      // Final sync of watch progress
      await trackWatchProgress(
        params.videoId,
        totalWatchedSeconds,
        player.currentTime
      );
      
      // Mark video as complete (backend validates watch percentage)
      const updatedProgress = await completeVideo(params.videoId);
      
      // Update local context
      updateTrainingProgress(updatedProgress);
      
      Alert.alert(
        "Video Complete!",
        "Great job! You can now proceed to the next module.",
        [
          {
            text: "OK",
            onPress: () => {
              navigateAfterVideoCleanup(() => router.push("/training"));
            }
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to complete video. Please try again.";
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigateAfterVideoCleanup(() => {
      try {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push("/training");
        }
      } catch {
        router.push("/training");
      }
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

  const videoDurationText = params.duration || "Video";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ChevronLeft color="#111827" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{params.title || "Training Video"}</Text>
          <Text style={styles.subtitle}>{videoDurationText}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut color="#6B7280" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.videoContainer}>
          <VideoView
            player={player}
            style={styles.video}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls
          />
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${progress}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}% Complete</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <BookOpen color="#6366F1" size={24} strokeWidth={2} />
            <Text style={styles.infoTitle}>About this video</Text>
          </View>
          <Text style={styles.infoText}>
            {params.description || "Watch this training video to learn more."}
          </Text>
        </View>

        {isComplete && (
          <View style={styles.completeCard}>
            <Text style={styles.completeEmoji}>✅</Text>
            <Text style={styles.completeTitle}>Video Complete!</Text>
            <Text style={styles.completeText}>
              You've finished watching this training module. Click below to mark it complete and continue.
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.buttonContainer}>
        <PrimaryButton
          title={isComplete ? "Mark Complete & Continue" : "Keep Watching"}
          onPress={handleContinue}
          disabled={!isComplete}
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
    textAlign: "center",
  },
  logoutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  videoContainer: {
    backgroundColor: "#000000",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: "hidden",
    ...Shadows.md,
  },
  video: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
  },
  progressContainer: {
    padding: 16,
    backgroundColor: "#FFFFFF",
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },
  infoText: {
    fontSize: 14,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 20,
  },
  completeCard: {
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
  },
  completeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  completeTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 8,
  },
  completeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#10B981",
    textAlign: "center",
    lineHeight: 20,
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
    ...Shadows.md,
    elevation: 8,
  },
});
