import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { adminMessageRateLimit } from "../middleware/rateLimit";
import { asyncHandler } from "../utils/asyncHandler";

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireAdmin);

adminRoutes.get(
  "/dashboard",
  asyncHandler(async (req, res) => adminController.dashboard(req, res)),
);
adminRoutes.get(
  "/dashboard/stats",
  asyncHandler(async (req, res) => adminController.dashboardStats(req, res)),
);
adminRoutes.get(
  "/dashboard/analytics",
  asyncHandler(async (req, res) =>
    adminController.dashboardAnalytics(req, res),
  ),
);

adminRoutes.get(
  "/users/stats",
  asyncHandler(async (req, res) => adminController.usersStats(req, res)),
);
adminRoutes.get(
  "/users",
  asyncHandler(async (req, res) => adminController.listUsers(req, res)),
);
adminRoutes.get(
  "/users/:uid",
  asyncHandler(async (req, res) => adminController.getUser(req, res)),
);
adminRoutes.patch(
  "/users/:uid/status",
  asyncHandler(async (req, res) => adminController.patchUserStatus(req, res)),
);
adminRoutes.get(
  "/users/:uid/conversations",
  asyncHandler(async (req, res) =>
    adminController.listUserConversations(req, res),
  ),
);

adminRoutes.get(
  "/farms",
  asyncHandler(async (req, res) => adminController.listFarms(req, res)),
);
adminRoutes.get(
  "/fields",
  asyncHandler(async (req, res) => adminController.listFields(req, res)),
);
adminRoutes.get(
  "/crops",
  asyncHandler(async (req, res) => adminController.listCrops(req, res)),
);
adminRoutes.get(
  "/yields",
  asyncHandler(async (req, res) => adminController.listYields(req, res)),
);
adminRoutes.get(
  "/disease-assessments",
  asyncHandler(async (req, res) => adminController.listDisease(req, res)),
);
adminRoutes.get(
  "/tasks",
  asyncHandler(async (req, res) => adminController.listTasks(req, res)),
);
adminRoutes.get(
  "/treatment-plans",
  asyncHandler(async (req, res) =>
    adminController.listTreatmentPlans(req, res),
  ),
);

adminRoutes.get(
  "/conversations/stats",
  asyncHandler(async (req, res) => adminController.chatStats(req, res)),
);
adminRoutes.get(
  "/conversations",
  asyncHandler(async (req, res) => adminController.listConversations(req, res)),
);
adminRoutes.get(
  "/conversations/:conversationId",
  asyncHandler(async (req, res) => adminController.getConversation(req, res)),
);
adminRoutes.get(
  "/conversations/:conversationId/messages",
  asyncHandler(async (req, res) => adminController.listMessages(req, res)),
);
adminRoutes.post(
  "/conversations/:conversationId/messages",
  adminMessageRateLimit,
  asyncHandler(async (req, res) => adminController.sendMessage(req, res)),
);
adminRoutes.post(
  "/conversations/:conversationId/read",
  asyncHandler(async (req, res) => adminController.markRead(req, res)),
);
adminRoutes.post(
  "/conversations/:conversationId/clear",
  asyncHandler(async (req, res) => adminController.clearConversation(req, res)),
);
adminRoutes.patch(
  "/conversations/:conversationId",
  asyncHandler(async (req, res) => adminController.patchConversation(req, res)),
);
