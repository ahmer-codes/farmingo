import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import { notificationService } from "../services/notifications";
import { ApiError } from "../utils/ApiError";

export const notificationController = {
  async list(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const items = await notificationService.list(req.userId);
    const unreadCount = items.filter((n) => !n.read).length;
    res.json({
      success: true,
      data: {
        items,
        unreadCount,
      },
    });
  },

  async unreadCount(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const unreadCount = await notificationService.unreadCount(req.userId);
    res.json({ success: true, data: { unreadCount } });
  },

  async markRead(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const id = String(req.params.id || "");
    const item = await notificationService.markRead(req.userId, id);
    res.json({ success: true, data: item });
  },

  async markAllRead(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const data = await notificationService.markAllRead(req.userId);
    res.json({ success: true, data });
  },

  async dismiss(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const id = String(req.params.id || "");
    await notificationService.dismiss(req.userId, id);
    res.json({ success: true, data: { id, dismissed: true } });
  },
};
