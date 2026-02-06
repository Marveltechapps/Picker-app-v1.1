/**
 * Training Video Configuration
 * 
 * Centralized configuration for training tutorial videos.
 * 
 * For development/testing: Uses 5-second dummy videos
 * For production: Replace DUMMY_VIDEO_URL with actual video URLs
 */

/**
 * 5-second dummy video URL for development/testing
 * This is a public sample video that's approximately 5 seconds long
 * 
 * Using a short sample video from a reliable CDN for testing purposes.
 * 
 * To use real videos in production:
 * 1. Replace this URL with your actual video URLs
 * 2. Or create a mapping: { video1: 'url1', video2: 'url2', ... }
 */
export const DUMMY_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

/**
 * Alternative: Use a shorter 5-second sample video
 * This is a sample video from a reliable CDN that's approximately 5 seconds
 */
export const SHORT_DUMMY_VIDEO_URL = "https://sample-videos.com/video123/mp4/240/big_buck_bunny_240p_1mb.mp4";

/**
 * Get video URL for a specific training video
 * Currently returns the same dummy video for all videos
 * 
 * @param videoId - The video ID (video1, video2, video3, video4)
 * @returns The video URL to use
 */
export function getTrainingVideoUrl(videoId: string): string {
  // For development: all videos use the same 5-second dummy video
  // For production: implement mapping here
  // Example:
  // const videoMap: Record<string, string> = {
  //   video1: 'https://your-cdn.com/video1.mp4',
  //   video2: 'https://your-cdn.com/video2.mp4',
  //   video3: 'https://your-cdn.com/video3.mp4',
  //   video4: 'https://your-cdn.com/video4.mp4',
  // };
  // return videoMap[videoId] || DUMMY_VIDEO_URL;
  
  return DUMMY_VIDEO_URL;
}

/**
 * Check if we're using dummy videos (for conditional logic if needed)
 */
export const IS_USING_DUMMY_VIDEOS = true;
