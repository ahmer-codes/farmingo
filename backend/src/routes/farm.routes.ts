import { Router } from "express";
import { farmController } from "../controllers/farm.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const farmRoutes = Router();

farmRoutes.get(
  "/overview",
  requireAuth,
  asyncHandler(async (req, res) => farmController.overview(req, res)),
);
