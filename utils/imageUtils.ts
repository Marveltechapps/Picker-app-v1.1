/**
 * Image utilities for converting and handling images
 */
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Convert image URI to base64 string with compression
 * Uses expo-image-manipulator for better URI handling and automatic compression
 * @param uri - Image URI (file://, content://, or http://)
 * @returns Base64 string with data URI prefix
 */
export async function convertImageToBase64(uri: string): Promise<string> {
  try {
    // If it's already a base64 string, return it
    if (uri.startsWith('data:')) {
      return uri;
    }

    console.log('[ImageUtils] Converting image to base64, URI:', uri);

    // Method 1: Try using ImageManipulator (handles all URI types + compression)
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1024 } }], // Resize to max 1024px width for reasonable file size
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG, 
          base64: true 
        }
      );

      if (manipResult.base64) {
        console.log('[ImageUtils] Successfully converted using ImageManipulator');
        return `data:image/jpeg;base64,${manipResult.base64}`;
      }
    } catch (manipError) {
      console.warn('[ImageUtils] ImageManipulator failed, trying FileSystem method:', manipError);
    }

    // Method 2: Fallback to FileSystem with content URI handling
    let fileUri = uri;
    
    // Handle Android content:// URIs by copying to cache first
    if (uri.startsWith('content://')) {
      console.log('[ImageUtils] Handling content:// URI, copying to cache');
      const filename = `temp_${Date.now()}.jpg`;
      const cachedUri = `${FileSystem.cacheDirectory}${filename}`;
      
      await FileSystem.copyAsync({
        from: uri,
        to: cachedUri,
      });
      
      fileUri = cachedUri;
      console.log('[ImageUtils] Copied to cache:', cachedUri);
    }

    // Validate file exists
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (!fileInfo.exists) {
      throw new Error('Image file not found at URI');
    }

    if ('size' in fileInfo && fileInfo.size === 0) {
      throw new Error('Image file is empty');
    }

    // Read the file as base64
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (!base64 || base64.length === 0) {
      throw new Error('Failed to read image data');
    }

    console.log('[ImageUtils] Successfully converted using FileSystem');
    return `data:image/jpeg;base64,${base64}`;
  } catch (error) {
    console.error('[ImageUtils] Error converting image to base64:', error);
    console.error('[ImageUtils] Failed URI:', uri);
    
    // Provide user-friendly error messages
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        throw new Error('Image file not accessible. Please try selecting the image again.');
      } else if (error.message.includes('permission')) {
        throw new Error('No permission to access the image. Please check app permissions.');
      } else if (error.message.includes('empty')) {
        throw new Error('Selected image is empty. Please choose a different image.');
      }
    }
    
    throw new Error('Failed to process image. Please try again or select a different image.');
  }
}

/**
 * Get file size from URI
 * @param uri - Image URI
 * @returns File size in bytes
 */
export async function getFileSize(uri: string): Promise<number> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    return fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
  } catch (error) {
    console.error('Error getting file size:', error);
    return 0;
  }
}

/**
 * Compress and convert image to base64 with custom quality
 * @param uri - Image URI
 * @param quality - Compression quality (0-1), default 0.8
 * @returns Base64 string with data URI prefix
 */
export async function compressAndConvertImage(
  uri: string,
  quality: number = 0.8
): Promise<string> {
  try {
    // If it's already a base64 string, return it
    if (uri.startsWith('data:')) {
      return uri;
    }

    console.log('[ImageUtils] Compressing and converting image with quality:', quality);

    // Use ImageManipulator for compression with custom quality
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Resize to max 1024px width
      { 
        compress: quality, 
        format: ImageManipulator.SaveFormat.JPEG, 
        base64: true 
      }
    );

    if (!manipResult.base64) {
      throw new Error('Failed to compress and convert image');
    }

    console.log('[ImageUtils] Successfully compressed and converted image');
    return `data:image/jpeg;base64,${manipResult.base64}`;
  } catch (error) {
    console.error('[ImageUtils] Error compressing image:', error);
    throw new Error('Failed to process image. Please try again.');
  }
}
