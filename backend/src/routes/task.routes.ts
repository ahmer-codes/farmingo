import { Router } from "express";
import { taskController } from "../controllers/task.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const taskRoutes = Router();

taskRoutes.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => taskController.list(req, res)),
);

taskRoutes.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => taskController.create(req, res)),
);

taskRoutes.get(
  "/plans/:id",
  requireAuth,
  asyncHandler(async (req, res) => taskController.getPlan(req, res)),
);

taskRoutes.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => taskController.get(req, res)),
);

taskRoutes.patch(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => taskController.update(req, res)),
);

taskRoutes.post(
  "/:id/complete",
  requireAuth,
  asyncHandler(async (req, res) => taskController.complete(req, res)),
);

taskRoutes.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => taskController.remove(req, res)),
);
