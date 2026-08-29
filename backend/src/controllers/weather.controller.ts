import type { Response } from "express";
import type { AuthedRequest } from "../middleware/auth";
import { weatherService } from "../services/weather";
import { ApiError } from "../utils/ApiError";

export const weatherController = {
  async current(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const data = await weatherService.getCurrent(req.userId);
    res.json({ success: true, data });
  },

  async forecast(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const data = await weatherService.getForecast(req.userId);
    res.json({ success: true, data });
  },
};
