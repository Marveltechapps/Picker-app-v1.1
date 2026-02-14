/**
 * Training Service
 *
 * Handles training progress per backend-workflow.yaml
 * (training_progress_get, training_progress_upsert).
 */

import { apiGet, apiPut, ApiClientError } from "@/utils/apiClient";

export interface TrainingProgress {
  video1: number;
  video2: number;
  video3: number;
  video4: number;
}

interface ApiDataResponse<T> {
  success: boolean;
  data: T;
}

/**
 * GET /training/progress – return current user training progress
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
 * PUT /training/progress – update training progress (video1..video4, 0–100)
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
