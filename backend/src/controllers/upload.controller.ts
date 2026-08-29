import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import type { UploadedImageFile } from "../services/cloudinary.service";
import { uploadService } from "../services/upload.service";
import { ApiError } from "../utils/ApiError";

function requireFile(req: AuthedRequest): UploadedImageFile {
  const file = (req as AuthedRequest & { file?: UploadedImageFile }).file;
  if (!file) {
    throw new ApiError(400, "Image file is required (field name: image)");
  }
  return file;
}

export const uploadController = {
  async profileImage(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");
    const data = await uploadService.uploadProfileImage(
      userId,
      requireFile(req),
    );
    res.status(201).json({ success: true, data });
  },

  async diseaseImage(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");
    const data = await uploadService.uploadDiseaseImage(
      userId,
      requireFile(req),
    );
    res.status(201).json({ success: true, data });
  },
};
