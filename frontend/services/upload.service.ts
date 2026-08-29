import type {
  DiseaseImageUploadResult,
  ProfileImageUploadResult,
} from "~/types";
import { apiRequest } from "./apiClient";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED.has(file.type)) {
    return "Unsupported image type. Use JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

function toFormData(file: File): FormData {
  const form = new FormData();
  form.append("image", file);
  return form;
}

export const uploadService = {
  uploadProfileImage(
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<ProfileImageUploadResult> {
    const error = validateImageFile(file);
    if (error) return Promise.reject(new Error(error));
    return apiRequest<ProfileImageUploadResult>("/uploads/profile-image", {
      method: "POST",
      formData: true,
      body: toFormData(file),
      onUploadProgress,
    });
  },

  uploadDiseaseImage(
    file: File,
    onUploadProgress?: (percent: number) => void,
  ): Promise<DiseaseImageUploadResult> {
    const error = validateImageFile(file);
    if (error) return Promise.reject(new Error(error));
    return apiRequest<DiseaseImageUploadResult>("/uploads/disease-image", {
      method: "POST",
      formData: true,
      body: toFormData(file),
      onUploadProgress,
    });
  },
};
