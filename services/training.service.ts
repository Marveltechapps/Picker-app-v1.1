/**
 * Training Service
 *
 * Enhanced with video management and watch-time tracking
 * Handles training progress per backend-workflow.yaml
 */

import { apiGet, apiPut, apiPost, ApiClientError } from "@/utils/apiClient";

export interface TrainingProgress {
  video1: number;
  video2: number;
  video3: number;
  video4: number;
  allCompleted?: boolean;
}

export interface TrainingVideo {
  videoId: string;
  title: string;
  description: string;
  duration: number;
  durationDisplay: string;
  videoUrl: string;
  thumbnailUrl?: string;
  order: number;
  progress: number; // 0-100
  completed: boolean;
  watchedSeconds: number;
  lastWatchedPosition: number;
}

interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

/**
 * GET /training/videos – get all training videos with user's progress
 */
export async function getTrainingVideos(): Promise<TrainingVideo[]> {
  try {
    const res = await apiGet<ApiDataResponse<TrainingVideo[]>>("/training/videos");
    return (res as ApiDataResponse<TrainingVideo[]>).data ?? [];
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error('[training] Failed to fetch training videos:', error);
      return [];
    }
    throw error;
  }
}

/**
 * GET /training/videos/:videoId – get single video with user's progress
 */
export async function getVideoById(videoId: string): Promise<TrainingVideo | null> {
  try {
    const res = await apiGet<ApiDataResponse<TrainingVideo>>(`/training/videos/${videoId}`);
    return (res as ApiDataResponse<TrainingVideo>).data ?? null;
  } catch (error) {
    if (error instanceof ApiClientError) {
      console.error('[training] Failed to fetch video:', error);
      return null;
    }
    throw error;
  }
}

/**
 * PUT /training/watch-progress – track watch progress (called every 5-10s from video player)
 */
export async function trackWatchProgress(
  videoId: string,
  watchedSeconds: number,
  currentPosition: number
): Promise<boolean> {
  try {
    await apiPut("/training/watch-progress", {
      videoId,
      watchedSeconds,
      currentPosition
    });
    return true;
  } catch (error) {
    console.warn('[training] Failed to track watch progress:', error);
    return false;
  }
}

/**
 * POST /training/complete/:videoId – mark video as complete (validates watch time on backend)
 */
export async function completeVideo(videoId: string): Promise<TrainingProgress> {
  try {
    const res = await apiPost<ApiDataResponse<TrainingProgress>>(
      `/training/complete/${videoId}`,
      {}
    );
    return (res as ApiDataResponse<TrainingProgress>).data ?? {
      video1: 0,
      video2: 0,
      video3: 0,
      video4: 0,
      allCompleted: false
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw error;
  }
}

/**
 * GET /training/user-progress – get user's overall training progress
 */
export async function getUserProgress(): Promise<TrainingProgress> {
  try {
    const res = await apiGet<ApiDataResponse<TrainingProgress>>("/training/user-progress");
    return (res as ApiDataResponse<TrainingProgress>).data ?? {
      video1: 0,
      video2: 0,
      video3: 0,
      video4: 0,
      allCompleted: false
    };
  } catch (error) {
    if (error instanceof ApiClientError) {
      return { video1: 0, video2: 0, video3: 0, video4: 0, allCompleted: false };
    }
    throw error;
  }
}

/**
 * Legacy: GET /training/progress – return current user training progress
 */
export async function getTrainingProgress(): Promise<TrainingProgress> {
  try {
    const res = await apiGet<ApiDataResponse<TrainingProgress>>("/training/progress");
    const data = (res as ApiDataResponse<TrainingProgress>).data;
    return (
      data ?? { video1: 0, video2: 0, video3: 0, video4: 0 }
    );
  } catch (error) {
    if (error instanceof ApiClientError) return { video1: 0, video2: 0, video3: 0, video4: 0 };
    throw error;
  }
}

/**
 * Legacy: PUT /training/progress – update training progress (video1..video4, 0–100)
 */
export async function updateTrainingProgressApi(
  progress: Partial<TrainingProgress>
): Promise<TrainingProgress> {
  try {
    const res = await apiPut<ApiDataResponse<TrainingProgress>>("/training/progress", progress);
    return (res as ApiDataResponse<TrainingProgress>).data ?? { video1: 0, video2: 0, video3: 0, video4: 0 };
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    throw error;
  }
}
