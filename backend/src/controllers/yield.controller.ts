import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { yieldAnalyticsService } from "../services/crop";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

const yieldUnitSchema = z.enum(["kg", "tonnes", "maunds"]);

const createSchema = z.object({
  cropId: z.string().min(1),
  periodLabel: z.string().min(1).max(80),
  periodDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedYield: z.number().min(0).max(1_000_000),
  actualYield: z.number().min(0).max(1_000_000),
  yieldUnit: yieldUnitSchema.optional(),
  season: z.string().min(2).max(40).optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  notes: z.string().max(2000).optional(),
});

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const yieldController = {
  async list(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const yearRaw = req.query.year ? Number(req.query.year) : undefined;
    const data = await yieldAnalyticsService.list(userId, {
      crop: req.query.crop ? String(req.query.crop) : undefined,
      field: req.query.field ? String(req.query.field) : undefined,
      season: req.query.season ? String(req.query.season) : undefined,
      year: Number.isFinite(yearRaw) ? yearRaw : undefined,
    });
    res.json({ success: true, data });
  },

  async analytics(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const yearRaw = req.query.year ? Number(req.query.year) : undefined;
    const data = await yieldAnalyticsService.analytics(userId, {
      crop: req.query.crop ? String(req.query.crop) : undefined,
      field: req.query.field ? String(req.query.field) : undefined,
      season: req.query.season ? String(req.query.season) : undefined,
      year: Number.isFinite(yearRaw) ? yearRaw : undefined,
    });
    res.json({ success: true, data });
  },

  async create(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid yield payload",
        fieldErrors(parsed.error),
      );
    const data = await yieldAnalyticsService.create(userId, parsed.data);
    res.status(201).json({ success: true, data });
  },
};
