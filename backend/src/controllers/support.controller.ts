import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { supportChatService } from "../services/supportChat.service";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

const messageSchema = z.object({
  text: z.string().min(1).max(4000),
});

const paginationSchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const conversationIdSchema = z.string().uuid();

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

function parseConversationId(raw: string) {
  const parsed = conversationIdSchema.safeParse(raw);
  if (!parsed.success) throw new ApiError(422, "Invalid conversation id");
  return parsed.data;
}

export const supportController = {
  async getCurrentConversation(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const userAgent = req.headers["user-agent"];
    const data = await supportChatService.getCurrentConversation(userId, {
      userAgent: typeof userAgent === "string" ? userAgent : undefined,
    });
    res.json({ success: true, data });
  },

  async listMessages(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const parsed = paginationSchema.safeParse(req.query);
    if (!parsed.success)
      throw new ApiError(422, "Invalid pagination", fieldErrors(parsed.error));
    const data = await supportChatService.listMessages(
      userId,
      conversationId,
      parsed.data.cursor,
      parsed.data.limit,
    );
    res.json({ success: true, data });
  },

  async sendMessage(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const parsed = messageSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(422, "Invalid message", fieldErrors(parsed.error));
    const data = await supportChatService.sendUserMessage(
      userId,
      conversationId,
      parsed.data.text,
    );
    res.status(201).json({ success: true, data });
  },

  async markRead(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const data = await supportChatService.markUserRead(userId, conversationId);
    res.json({ success: true, data });
  },

  async clearConversation(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const conversationId = parseConversationId(
      String(req.params.conversationId || ""),
    );
    const data = await supportChatService.clearConversation(
      userId,
      conversationId,
    );
    res.json({
      success: true,
      data,
      message: "Conversation cleared. A new thread has been started.",
    });
  },

  async unreadCount(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const unreadCount = await supportChatService.getUnreadCount(userId);
    res.json({ success: true, data: { unreadCount } });
  },
};
