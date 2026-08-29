import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { cropService } from "../services/crop";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

const landUnitSchema = z.enum(["hectares", "acres"]);
const yieldUnitSchema = z.enum(["kg", "tonnes", "maunds"]);
const growthStageSchema = z.enum([
  "establishment",
  "vegetative",
  "flowering",
  "fruiting",
  "grain_filling",
  "maturity",
  "harvest",
  "fallow",
]);
const healthSchema = z.enum(["healthy", "watch", "at_risk", "critical"]);

const createSchema = z.object({
  fieldId: z.string().min(1),
  name: z.string().min(1).max(80),
  variety: z.string().max(80).optional(),
  area: z.number().positive().max(100000).optional(),
  areaUnit: landUnitSchema.optional(),
  plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  expectedHarvestDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  growthStage: growthStageSchema,
  expectedYield: z.number().min(0).max(1_000_000),
  actualYield: z.number().min(0).max(1_000_000).nullable().optional(),
  yieldUnit: yieldUnitSchema.optional(),
  season: z.string().min(2).max(40),
  year: z.number().int().min(2000).max(2100),
  healthStatus: healthSchema.optional(),
  healthScore: z.number().int().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = createSchema.partial();

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const cropController = {
  async list(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await cropService.list(userId);
    res.json({ success: true, data });
  },

  async get(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await cropService.get(userId, String(req.params.id));
    res.json({ success: true, data });
  },

  async create(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid crop payload",
        fieldErrors(parsed.error),
      );
    const data = await cropService.create(userId, parsed.data);
    res.status(201).json({ success: true, data });
  },

  async update(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid crop payload",
        fieldErrors(parsed.error),
      );
    const data = await cropService.update(
      userId,
      String(req.params.id),
      parsed.data,
    );
    res.json({ success: true, data });
  },

  async remove(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await cropService.remove(userId, String(req.params.id));
    res.json({ success: true, data });
  },
};
