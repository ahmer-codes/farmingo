import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import {
  adminDashboardService,
  adminResourcesService,
  adminUsersService,
} from "../services/admin/admin.service";
import { adminSupportChatService } from "../services/supportChat.service";
import { ApiError } from "../utils/ApiError";

const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const messagePaginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const userListSchema = paginationSchema.extend({
  search: z.string().max(120).optional(),
  status: z.enum(["active", "disabled"]).optional(),
  accountType: z.enum(["farmer", "admin"]).optional(),
  activity: z
    .enum(["active_today", "active_week", "inactive_7d", "never_active"])
    .optional(),
  joinedSince: z.string().min(10).max(40).optional(),
});

const conversationListSchema = paginationSchema.extend({
  search: z.string().max(120).optional(),
  status: z.enum(["open", "pending", "resolved"]).optional(),
  priority: z.enum(["normal", "high"]).optional(),
  unreadOnly: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v) => v === "true"),
  sort: z.enum(["activity", "unread", "priority"]).optional(),
});

const messageSchema = z.object({
  text: z.string().min(1).max(4000),
});

const userStatusSchema = z.object({
  status: z.enum(["active", "disabled"]),
});

const conversationIdSchema = z.string().uuid();

const conversationPatchSchema = z.object({
  status: z.enum(["open", "pending", "resolved"]).optional(),
  priority: z.enum(["normal", "high"]).optional(),
  assignedAdminId: z.string().min(1).max(128).optional(),
});

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function parseConversationId(raw: string) {
  const parsed = conversationIdSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError(422, "Invalid conversation id");
  return parsed.data;
}

const dashboardRangeSchema = z.object({
  range: z.enum(["7d", "30d", "90d", "180d", "365d"]).optional(),
});

export const adminController = {
  async dashboard(req: AuthedRequest, res: Response) {
    const parsed = dashboardRangeSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminDashboardService.getDashboard(parsed.data.range);
    res.json({ success: true, data });
  },

  async dashboardStats(_req: AuthedRequest, res: Response) {
    const data = await adminDashboardService.getStats();
    res.json({ success: true, data });
  },

  async dashboardAnalytics(_req: AuthedRequest, res: Response) {
    const data = await adminDashboardService.getAnalytics();
    res.json({ success: true, data });
  },

  async usersStats(_req: AuthedRequest, res: Response) {
    const data = await adminUsersService.getStats();
    res.json({ success: true, data });
  },

  async listUsers(req: AuthedRequest, res: Response) {
    const parsed = userListSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminUsersService.listUsers(parsed.data);
    res.json({ success: true, data });
  },

  async getUser(req: AuthedRequest, res: Response) {
    const uid = String(req.params.uid || "");
    const data = await adminUsersService.getUserDetail(uid);
    res.json({ success: true, data });
  },

  async patchUserStatus(req: AuthedRequest, res: Response) {
    const uid = String(req.params.uid || "");
    const parsed = userStatusSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "Invalid payload", fieldErrors(parsed.error));
    const adminId = req.userId;
    if (!adminId) throw new ApiError(401, "Unauthorized");
    const data = await adminUsersService.patchUserStatus(
      uid,
      parsed.data.status,
      adminId,
    );
    res.json({
      success: true,
      data,
      message: `User ${parsed.data.status === "disabled" ? "disabled" : "re-enabled"}`,
    });
  },

  async listFarms(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listFarms(parsed.data);
    res.json({ success: true, data });
  },

  async listFields(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listFields(parsed.data);
    res.json({ success: true, data });
  },

  async listCrops(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listCrops(parsed.data);
    res.json({ success: true, data });
  },

  async listYields(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listYields(parsed.data);
    res.json({ success: true, data });
  },

  async listDisease(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listDiseaseAssessments(
      parsed.data,
    );
    res.json({ success: true, data });
  },

  async listTasks(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listTasks(parsed.data);
    res.json({ success: true, data });
  },

  async listTreatmentPlans(req: AuthedRequest, res: Response) {
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminResourcesService.listTreatmentPlans(parsed.data);
    res.json({ success: true, data });
  },

  async listConversations(req: AuthedRequest, res: Response) {
    const parsed = conversationListSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminSupportChatService.listConversations(parsed.data);
    res.json({ success: true, data });
  },

  async getConversation(req: AuthedRequest, res: Response) {
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const data = await adminSupportChatService.getConversation(conversationId);
    res.json({ success: true, data });
  },

  async listUserConversations(req: AuthedRequest, res: Response) {
    const uid = String(req.params.uid || "");
    const data = await adminSupportChatService.listUserConversations(uid);
    res.json({ success: true, data });
  },

  async listMessages(req: AuthedRequest, res: Response) {
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const parsed = messagePaginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid query", fieldErrors(parsed.error));
    const data = await adminSupportChatService.listMessages(
      conversationId,
      parsed.data.cursor,
      parsed.data.limit,
    );
    res.json({ success: true, data });
  },

  async sendMessage(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "Invalid message", fieldErrors(parsed.error));
    const data = await adminSupportChatService.sendAdminMessage(
      req.userId,
      conversationId,
      parsed.data.text,
    );
    res.status(201).json({ success: true, data });
  },

  async markRead(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const data = await adminSupportChatService.markAdminRead(
      req.userId,
      conversationId,
    );
    res.json({ success: true, data });
  },

  async clearConversation(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const data = await adminSupportChatService.clearConversation(
      req.userId,
      conversationId,
    );
    res.json({
      success: true,
      data,
      message: "Conversation cleared and restarted for the user.",
    });
  },

  async patchConversation(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const parsed = conversationPatchSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "Invalid payload", fieldErrors(parsed.error));
    const data = await adminSupportChatService.updateConversation(
      req.userId,
      conversationId,
      parsed.data,
    );
    res.json({ success: true, data });
  },

  async chatStats(_req: AuthedRequest, res: Response) {
    const data = await adminSupportChatService.getUnreadStats();
    res.json({ success: true, data });
  },
};
