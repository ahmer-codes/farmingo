import { Router } from "express";
import { cropController } from "../controllers/crop.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const cropRoutes = Router();

cropRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => cropController.list(req, res)),
);

cropRoutes.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => cropController.get(req, res)),
);

cropRoutes.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => cropController.create(req, res)),
);

cropRoutes.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => cropController.update(req, res)),
);

cropRoutes.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => cropController.remove(req, res)),
);
