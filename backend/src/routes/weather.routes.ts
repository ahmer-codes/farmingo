import { Router } from "express";
import { weatherController } from "../controllers/weather.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const weatherRoutes = Router();

weatherRoutes.get(
  "/current",
  requireAuth,
  asyncHandler(async (req, res) => weatherController.current(req, res)),
);

weatherRoutes.get(
  "/forecast",
  requireAuth,
  asyncHandler(async (req, res) => weatherController.forecast(req, res)),
);
