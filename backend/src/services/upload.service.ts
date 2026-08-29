import type {
  CloudinaryUploadResult,
  UploadedImageFile,
} from "./cloudinary.service";
import { cloudinaryService } from "./cloudinary.service";
import {
  diseaseAssessmentRepository,
  farmRepository,
  userRepository,
} from "../repositories";
import { ApiError } from "../utils/ApiError";
import { toFarmProfile, toPublicUser } from "./auth.service";

export interface DiseaseImageRecord {
  id: string;
  userId: string;
  imageUrl: string;
  publicId: string;
  uploadedAt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export const uploadService = {
  async uploadProfileImage(userId: string, file: UploadedImageFile) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const previousPublicId = user.avatarPublicId;
    const asset = await cloudinaryService.uploadForUser(
      userId,
      "profile",
      file,
    );

    const updatedUser = await userRepository.update(userId, {
      avatarUrl: asset.imageUrl,
      avatarPublicId: asset.publicId,
      avatarUploadedAt: asset.uploadedAt,
    });

    if (!updatedUser) throw new ApiError(404, "User not found");

    if (previousPublicId && previousPublicId !== asset.publicId) {
      await cloudinaryService.deleteByPublicId(previousPublicId);
    }

    const farm = await farmRepository.findByOwnerId(userId);

    return {
      user: toPublicUser(updatedUser),
      farm: toFarmProfile(farm),
      image: {
        imageUrl: asset.imageUrl,
        publicId: asset.publicId,
        uploadedAt: asset.uploadedAt,
      },
    };
  },

  async uploadDiseaseImage(userId: string, file: UploadedImageFile) {
    const user = await userRepository.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    const asset = await cloudinaryService.uploadForUser(
      userId,
      "disease-assessments",
      file,
    );

    return {
      imageUrl: asset.imageUrl,
      publicId: asset.publicId,
      uploadedAt: asset.uploadedAt,
      width: asset.width,
      height: asset.height,
      format: asset.format,
      bytes: asset.bytes,
    };
  },

  async getDiseaseImage(
    userId: string,
    id: string,
  ): Promise<DiseaseImageRecord | null> {
    const record = await diseaseAssessmentRepository.findByIdForOwner(
      id,
      userId,
    );
    if (!record || !record.imageUrl || !record.imagePublicId) return null;
    return {
      id: record.id,
      userId: record.ownerId,
      imageUrl: record.imageUrl,
      publicId: record.imagePublicId,
      uploadedAt: record.createdAt,
    };
  },

  toAssetRef(asset: CloudinaryUploadResult) {
    return {
      imageUrl: asset.imageUrl,
      publicId: asset.publicId,
      uploadedAt: asset.uploadedAt,
    };
  },
};
