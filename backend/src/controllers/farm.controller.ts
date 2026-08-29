import type { Response } from "express";
import { farmService } from "../services/farm.service";
import type { AuthedRequest } from "../middleware/auth";
import { requireUserId } from "../utils/authHelpers";

export const farmController = {
  async overview(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await farmService.getOverview(userId);
    res.json({ success: true, data });
  },
};
