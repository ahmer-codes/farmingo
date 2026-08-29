import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { MAX_IMAGE_BYTES } from "../services/cloudinary.service";
import { ApiError } from "../utils/ApiError";

const memoryStorage = multer.memoryStorage();

/**
 * Multipart image upload, memory only (no disk writes).
 * Field name: `image`
 */
export const imageUpload = multer({
  storage: memoryStorage,
  limits: {
    fileSize: MAX_IMAGE_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      cb(new ApiError(400, "Unsupported image type. Use JPEG, PNG, or WebP."));
      return;
    }
    cb(null, true);
  },
}).single("image");

export function multerErrorHandler(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (!err) {
    next();
    return;
  }
  if (err instanceof ApiError) {
    next(err);
    return;
  }
  if (typeof err === "object" && err && "code" in err) {
    const code = String((err as { code?: string }).code || "");
    if (code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "Image must be 5 MB or smaller."));
      return;
    }
    if (code === "LIMIT_UNEXPECTED_FILE") {
      next(new ApiError(400, 'Unexpected file field. Use field name "image".'));
      return;
    }
  }
  next(err);
}
