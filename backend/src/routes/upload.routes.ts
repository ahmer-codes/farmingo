import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import { uploadController } from "../controllers/upload.controller";
import { requireAuth } from "../middleware/auth";
import { imageUpload, multerErrorHandler } from "../middleware/upload";
import { asyncHandler } from "../utils/asyncHandler";

export const uploadRoutes = Router();

uploadRoutes.post(
  "/profile-image",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    imageUpload(req, res, (err: unknown) =>
      multerErrorHandler(err, req, res, next),
    );
  },
  asyncHandler(async (req, res) => uploadController.profileImage(req, res)),
);

uploadRoutes.post(
  "/disease-image",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    imageUpload(req, res, (err: unknown) =>
      multerErrorHandler(err, req, res, next),
    );
  },
  asyncHandler(async (req, res) => uploadController.diseaseImage(req, res)),
);
