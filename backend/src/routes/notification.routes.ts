import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const notificationRoutes = Router();

notificationRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => notificationController.list(req, res)),
);

notificationRoutes.get(
  "/unread-count",
  requireAuth,
  asyncHandler(async (req, res) =>
    notificationController.unreadCount(req, res),
  ),
);

notificationRoutes.post(
  "/read-all",
  requireAuth,
  asyncHandler(async (req, res) =>
    notificationController.markAllRead(req, res),
  ),
);

notificationRoutes.post(
  "/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => notificationController.markRead(req, res)),
);

notificationRoutes.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => notificationController.dismiss(req, res)),
);
