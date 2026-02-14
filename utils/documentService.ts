/**
 * Document Service
 *
 * Handles document upload and fetch per backend-workflow.yaml (documents_upload, documents_list).
 */

import { apiGet, apiPostFormData, ApiClientError } from "@/utils/apiClient";

export interface DocumentUploadResponse {
  success: boolean;
  message?: string;
  documentUrl?: string;
  error?: string;
}

export interface DocumentFetchResponse {
  success: boolean;
  documents?: {
    aadhar?: {
      front?: string | null;
      back?: string | null;
    };
    pan?: {
      front?: string | null;
      back?: string | null;
    };
  };
  error?: string;
}

/**
 * Upload a document to the backend
 * POST /documents/upload – multipart docType, side, file
 */
export async function uploadDocument(
  docType: "aadhar" | "pan",
  side: "front" | "back",
  uri: string
): Promise<DocumentUploadResponse> {
  try {
    const formData = new FormData();
    formData.append("docType", docType);
    formData.append("side", side);
    formData.append("file", {
      uri,
      type: "image/jpeg",
      name: `doc-${docType}-${side}.jpg`,
    } as unknown as Blob);
    const response = await apiPostFormData<DocumentUploadResponse>(
      "/documents/upload",
      formData
    );
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upload document",
    };
  }
}

/**
 * Fetch user documents from the backend
 * GET /documents – returns { success, documents: { aadhar: { front, back }, pan: { front, back } } }
 */
export async function fetchDocuments(): Promise<DocumentFetchResponse> {
  try {
    const response = await apiGet<DocumentFetchResponse>("/documents");
    return response;
  } catch (error) {
    if (error instanceof ApiClientError) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch documents",
    };
  }
}

/**
 * Update/replace a document
 * @param docType - Type of document ('aadhar' | 'pan')
 * @param side - Side of document ('front' | 'back')
 * @param uri - Local file URI
 * @returns Promise with update response
 */
export async function updateDocument(
  docType: "aadhar" | "pan",
  side: "front" | "back",
  uri: string
): Promise<DocumentUploadResponse> {
  // Update is same as upload for now
  return uploadDocument(docType, side, uri);
}

/**
 * Validate file before upload
 * @param uri - File URI
 * @param fileSize - File size in bytes
 * @param width - Image width (optional)
 * @param height - Image height (optional)
 * @returns Object with validation result and error message
 */
export function validateDocumentFile(
  uri: string,
  fileSize?: number,
  width?: number,
  height?: number
): { isValid: boolean; error?: string } {
  // Check file size (max 10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: "File size exceeds 10MB. Please upload a smaller file.",
    };
  }

  // Check image dimensions
  if (width && height) {
    const MIN_DIMENSION = 200;
    if (width < MIN_DIMENSION || height < MIN_DIMENSION) {
      return {
        isValid: false,
        error: `Image dimensions must be at least ${MIN_DIMENSION}x${MIN_DIMENSION} pixels.`,
      };
    }
  }

  // Check file extension (basic check)
  const validExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
  const uriLower = uri.toLowerCase();
  const hasValidExtension = validExtensions.some((ext) => uriLower.endsWith(ext));

  if (!hasValidExtension && uri.includes(".")) {
    return {
      isValid: false,
      error: "Invalid file type. Please upload JPG, PNG, or PDF files only.",
    };
  }

  return { isValid: true };
}
