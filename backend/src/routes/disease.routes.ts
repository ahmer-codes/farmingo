import { Router } from "express";
import { diseaseController } from "../controllers/disease.controller";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const diseaseRoutes = Router();

diseaseRoutes.get(
  "/crops",
  requireAuth,
  asyncHandler(async (req, res) => diseaseController.crops(req, res)),
);

diseaseRoutes.get(
  "/symptoms",
  requireAuth,
  asyncHandler(async (req, res) => diseaseController.symptoms(req, res)),
);

diseaseRoutes.post(
  "/analyze",
  requireAuth,
  asyncHandler(async (req, res) => diseaseController.analyze(req, res)),
);

diseaseRoutes.get(
  "/assessments",
  requireAuth,
  asyncHandler(async (req, res) => diseaseController.listAssessments(req, res)),
);

diseaseRoutes.get(
  "/assessments/:id",
  requireAuth,
  asyncHandler(async (req, res) => diseaseController.getAssessment(req, res)),
);

diseaseRoutes.post(
  "/treatment-plan",
  requireAuth,
  asyncHandler(async (req, res) =>
    diseaseController.createTreatmentPlan(req, res),
  ),
);
