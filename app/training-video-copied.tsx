import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, BookOpen } from "lucide-react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { useAuth, type TrainingProgress } from "@/state/authContext";

export default function TrainingVideoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    videoId: keyof TrainingProgress;
    title: string;
    duration: string;
    description: string;
  }>();
  
  const { updateTrainingProgress, trainingProgress } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const videoRef = useRef<Video>(null);

  const savedProgress = params.videoId ? trainingProgress[params.videoId] : 0;

  useEffect(() => {
    if (savedProgress === 100) {
      setIsComplete(true);
      setProgress(100);
    }
  }, [savedProgress]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      return;
    }

    setIsPlaying(status.isPlaying);

    if (status.durationMillis && status.positionMillis) {
      const progressPercent = Math.floor((status.positionMillis / status.durationMillis) * 100);
      setProgress(progressPercent);

      if (progressPercent >= 99 && !isComplete) {
        setIsComplete(true);
      }
    }
  };

  const handlePlayPress = async () => {
    if (videoRef.current) {
      if (isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
  };

  const getVideoDescription = (description: string | undefined) => {
    if (!description) return "";
    
    const descriptions: Record<string, string> = {
      "what is picking?": "This training module will teach you the essential skills needed for what is picking?. Watch the entire video to unlock the next module and continue your training.",
      "how to use the hsd": "This training module will teach you the essential skills needed for how to use the hsd. Watch the entire video to unlock the next module and continue your training.",
      "safety rules": "This training module will teach you the essential skills needed for safety rules. Watch the entire video to unlock the next module and continue your training.",
      "packing standards": "This training module will teach you the essential skills needed for packing standards. Watch the entire video to unlock the next module and continue your training.",
    };

    return descriptions[description.toLowerCase()] || descriptions["what is picking?"];
  };

  const getDurationInMinutes = (duration: string | undefined): number => {
    if (!duration) return 5;
    const match = duration.match(/(\d+)\s*min/);
    return match ? parseInt(match[1], 10) : 5;
  };

  const durationMinutes = getDurationInMinutes(params.duration);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeft color="#111827" size={28} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleSection}>
          <Text style={styles.title}>{params.title}</Text>
          <Text style={styles.subtitle}>{params.duration} training video</Text>
        </View>

        <View style={styles.videoContainer}>
          {progress === 100 ? (
            <View style={styles.completedVideoPlaceholder}>
              <Text style={styles.completedVideoText}>Training in progress...</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: "100%" }]} />
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationText}>{params.duration}</Text>
                <Text style={styles.durationText}>{params.duration}</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.videoPlaceholder}
              onPress={handlePlayPress}
              activeOpacity={0.9}
            >
              {isPlaying ? (
                <>
                  <Text style={styles.videoPlaceholderText}>Training in progress...</Text>
                  <ActivityIndicator size="large" color="#6366F1" style={styles.spinner} />
                </>
              ) : (
                <>
                  <View style={styles.playButton}>
                    <View style={styles.playIcon} />
                  </View>
                  <Text style={styles.videoPlaceholderText}>Click to Start</Text>
                </>
              )}
              <View style={styles.progressBar}>
                <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
              </View>
              <View style={styles.durationRow}>
                <Text style={styles.durationText}>{Math.floor((progress / 100) * durationMinutes)} min</Text>
                <Text style={styles.durationText}>{durationMinutes} min</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <Video
            ref={videoRef}
            style={styles.hiddenVideo}
            source={{ uri: "https://www.w3schools.com/html/mov_bbb.mp4" }}
            useNativeControls={false}
            resizeMode={ResizeMode.CONTAIN}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            shouldPlay={false}
            progressUpdateIntervalMillis={100}
          />
        </View>

        <View style={styles.aboutSection}>
          <Text style={styles.aboutTitle}>About this module</Text>
          <Text style={styles.aboutText}>
            {getVideoDescription(params.description)}
          </Text>

          <View style={styles.progressCard}>
            <View style={styles.progressIconContainer}>
              <BookOpen color="#6366F1" size={24} strokeWidth={2} />
            </View>
            <View style={styles.progressTextContainer}>
              <Text style={styles.progressCardTitle}>Video Progress</Text>
              <Text style={styles.progressCardText}>
                {isComplete
                  ? "Great! You've completed this module. Click continue to proceed."
                  : "Watch the complete video to mark as completed and unlock next module."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 24,
  },
  videoContainer: {
    marginBottom: 32,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#000000",
  },
  videoPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  completedVideoPlaceholder: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(99, 102, 241, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  playIcon: {
    width: 0,
    height: 0,
    marginLeft: 8,
    borderLeftWidth: 24,
    borderTopWidth: 16,
    borderBottomWidth: 16,
    borderLeftColor: "#FFFFFF",
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
  },
  videoPlaceholderText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  completedVideoText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#9CA3AF",
    marginBottom: 16,
  },
  spinner: {
    marginTop: 8,
  },
  hiddenVideo: {
    width: 0,
    height: 0,
    opacity: 0,
  },
  progressBar: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#6366F1",
    borderRadius: 2,
  },
  durationRow: {
    position: "absolute",
    bottom: 16,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  durationText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  aboutSection: {
    marginBottom: 32,
  },
  aboutTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 16,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 24,
    marginBottom: 24,
  },
  progressCard: {
    flexDirection: "row",
    backgroundColor: "#EEF2FF",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#C7D2FE",
  },
  progressIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  progressTextContainer: {
    flex: 1,
  },
  progressCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  progressCardText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280",
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 100,
  },
});

