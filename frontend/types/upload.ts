export interface UploadedImageAsset {
  imageUrl: string;
  publicId: string;
  uploadedAt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  id?: string;
}

export interface ProfileImageUploadResult {
  user: import("~/types").User;
  farm: import("~/types").FarmProfile | null;
  image: {
    imageUrl: string;
    publicId: string;
    uploadedAt: string;
  };
}

export type DiseaseImageUploadResult = UploadedImageAsset;
