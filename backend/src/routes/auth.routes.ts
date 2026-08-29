import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post(
  "/bootstrap",
  requireAuth,
  asyncHandler(async (req, res) => authController.bootstrap(req, res)),
);
authRoutes.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => authController.me(req, res)),
);
authRoutes.post(
  "/session-start",
  requireAuth,
  asyncHandler(async (req, res) => authController.sessionStart(req, res)),
);
authRoutes.post(
  "/activity",
  requireAuth,
  asyncHandler(async (req, res) => authController.activity(req, res)),
);
authRoutes.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => authController.updateProfile(req, res)),
);
authRoutes.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => authController.logout(req, res)),
);
