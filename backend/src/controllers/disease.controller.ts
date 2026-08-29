import type { Request, Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { diseaseAnalysisService } from "../services/diseaseAnalysis.service";
import { diseaseAssessmentService } from "../services/diseaseAssessment.service";
import { treatmentPlanService } from "../services/treatmentPlan.service";
import { ApiError } from "../utils/ApiError";

const imageMetaSchema = z
  .object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(3).max(100),
    sizeBytes: z.number().int().positive().max(12_000_000),
    width: z.number().int().positive().max(10000).optional(),
    height: z.number().int().positive().max(10000).optional(),
  })
  .nullable()
  .optional();

const analyzeSchema = z
  .object({
    cropRecordId: z.string().uuid(),
    symptomIds: z.array(z.string().min(1)).min(1).max(30),
    image: imageMetaSchema,
    imageUrl: z.string().url().optional(),
    imagePublicId: z.string().min(1).optional(),
  })
  .refine(
    (data) =>
      (!data.imageUrl && !data.imagePublicId) ||
      (Boolean(data.imageUrl) && Boolean(data.imagePublicId)),
    {
      message: "imageUrl and imagePublicId must be provided together",
      path: ["imageUrl"],
    },
  );

const treatmentSchema = z.object({
  assessmentId: z.string().uuid(),
});

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const diseaseController = {
  crops(_req: Request, res: Response) {
    res.json({ success: true, data: diseaseAnalysisService.listCrops() });
  },

  symptoms(_req: Request, res: Response) {
    res.json({ success: true, data: diseaseAnalysisService.listSymptoms() });
  },

  async listAssessments(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");
    const data = await diseaseAssessmentService.listForUser(userId);
    res.json({ success: true, data });
  },

  async getAssessment(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");
    const data = await diseaseAssessmentService.getForUser(
      userId,
      req.params.id,
    );
    res.json({ success: true, data });
  },

  async analyze(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");

    const parsed = analyzeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid analysis request",
        fieldErrors(parsed.error),
      );
    }

    const data = await diseaseAssessmentService.analyzeAndPersist(
      userId,
      parsed.data,
    );
    res.json({ success: true, data });
  },

  async createTreatmentPlan(req: AuthedRequest, res: Response) {
    const userId = req.userId;
    if (!userId) throw new ApiError(401, "Authentication required");

    const parsed = treatmentSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid treatment plan payload",
        fieldErrors(parsed.error),
      );
    }
    const data = await treatmentPlanService.createFromAssessment(
      userId,
      parsed.data.assessmentId,
    );
    res.status(201).json({ success: true, data, message: data.message });
  },
};
