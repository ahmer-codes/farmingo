import { cloudinary } from "../config/cloudinary";
import { ApiError } from "../utils/ApiError";

export type FarmingoImageFolder = "profile" | "disease-assessments" | "crops";

export interface CloudinaryUploadResult {
  imageUrl: string;
  publicId: string;
  uploadedAt: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  folder: string;
}

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function folderFor(userId: string, kind: FarmingoImageFolder): string {
  return `farmingo/users/${userId}/${kind}`;
}

export interface UploadedImageFile {
  mimetype: string;
  size: number;
  buffer: Buffer;
  originalname?: string;
}

function assertValidImage(file: UploadedImageFile) {
  if (!file?.buffer?.length) {
    throw new ApiError(400, "Image file is required");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ApiError(400, "Unsupported image type. Use JPEG, PNG, or WebP.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(400, "Image must be 5 MB or smaller.");
  }
}

function uploadBuffer(
  buffer: Buffer,
  options: { folder: string },
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        use_filename: false,
      },
      (error, result) => {
        if (error || !result?.secure_url || !result.public_id) {
          reject(
            new ApiError(
              502,
              error?.message || "Failed to upload image to Cloudinary",
            ),
          );
          return;
        }
        resolve({
          imageUrl: result.secure_url,
          publicId: result.public_id,
          uploadedAt: new Date().toISOString(),
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          folder: options.folder,
        });
      },
    );
    stream.end(buffer);
  });
}

export const cloudinaryService = {
  allowedMimeTypes: ALLOWED_MIME_TYPES,
  maxBytes: MAX_IMAGE_BYTES,

  buildFolder(userId: string, kind: FarmingoImageFolder) {
    return folderFor(userId, kind);
  },

  validateImage(file: UploadedImageFile) {
    assertValidImage(file);
  },

  async uploadForUser(
    userId: string,
    kind: FarmingoImageFolder,
    file: UploadedImageFile,
  ): Promise<CloudinaryUploadResult> {
    assertValidImage(file);
    const folder = folderFor(userId, kind);
    return uploadBuffer(file.buffer, { folder });
  },

  async deleteByPublicId(publicId: string | undefined | null): Promise<void> {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch (err) {
      console.warn("[cloudinary] failed to delete asset", publicId, err);
    }
  },
};
