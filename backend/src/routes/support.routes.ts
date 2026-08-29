import { Router } from "express";
import { supportController } from "../controllers/support.controller";
import { requireAuth } from "../middleware/auth";
import { supportMessageRateLimit } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

export const supportRoutes = Router();

supportRoutes.use(requireAuth);

supportRoutes.get(
  "/conversations/current",
  asyncHandler(async (req, res) =>
    supportController.getCurrentConversation(req, res),
  ),
);
supportRoutes.get(
  "/conversations/current/unread-count",
  asyncHandler(async (req, res) => supportController.unreadCount(req, res)),
);
supportRoutes.get(
  "/conversations/:conversationId/messages",
  asyncHandler(async (req, res) => supportController.listMessages(req, res)),
);
supportRoutes.post(
  "/conversations/:conversationId/messages",
  supportMessageRateLimit,
  asyncHandler(async (req, res) => supportController.sendMessage(req, res)),
);
supportRoutes.post(
  "/conversations/:conversationId/read",
  asyncHandler(async (req, res) => supportController.markRead(req, res)),
);
supportRoutes.post(
  "/conversations/:conversationId/clear",
  asyncHandler(async (req, res) =>
    supportController.clearConversation(req, res),
  ),
);
