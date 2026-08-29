import { Router } from "express";
import { fieldController } from "../controllers/field.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const fieldRoutes = Router();

fieldRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => fieldController.list(req, res)),
);

fieldRoutes.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => fieldController.get(req, res)),
);

fieldRoutes.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => fieldController.create(req, res)),
);

fieldRoutes.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => fieldController.update(req, res)),
);

fieldRoutes.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => fieldController.remove(req, res)),
);
