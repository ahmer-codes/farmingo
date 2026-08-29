import { Router } from "express";
import { yieldController } from "../controllers/yield.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const yieldRoutes = Router();

yieldRoutes.get(
  "/analytics",
  requireAuth,
  asyncHandler(async (req, res) => yieldController.analytics(req, res)),
);

yieldRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => yieldController.list(req, res)),
);

yieldRoutes.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => yieldController.create(req, res)),
);
