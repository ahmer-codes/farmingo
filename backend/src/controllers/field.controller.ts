import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { fieldService } from "../services/crop";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

const landUnitSchema = z.enum(["hectares", "acres"]);

const geoSchema = z
  .object({
    referencePoint: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
      })
      .nullable()
      .optional(),
    boundaryGeoJson: z.record(z.unknown()).nullable().optional(),
    imageryReady: z.boolean().optional(),
    coordinateSystem: z.string().nullable().optional(),
    source: z
      .enum(["manual", "gps_survey", "cadastral", "unknown"])
      .nullable()
      .optional(),
  })
  .optional();

const createSchema = z.object({
  name: z.string().min(1).max(120),
  area: z.number().positive().max(100000),
  areaUnit: landUnitSchema.optional(),
  layoutRow: z.number().int().min(0).max(20).optional(),
  layoutCol: z.number().int().min(0).max(20).optional(),
  layoutSpan: z.number().int().min(1).max(4).optional(),
  notes: z.string().max(2000).optional(),
  geo: geoSchema,
});

const updateSchema = createSchema.partial();

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const fieldController = {
  async list(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await fieldService.list(userId);
    res.json({ success: true, data });
  },

  async get(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await fieldService.get(userId, String(req.params.id));
    res.json({ success: true, data });
  },

  async create(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid field payload",
        fieldErrors(parsed.error),
      );
    const data = await fieldService.create(userId, parsed.data);
    res.status(201).json({ success: true, data });
  },

  async update(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ApiError(
        400,
        "Invalid field payload",
        fieldErrors(parsed.error),
      );
    const data = await fieldService.update(
      userId,
      String(req.params.id),
      parsed.data,
    );
    res.json({ success: true, data });
  },

  async remove(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await fieldService.remove(userId, String(req.params.id));
    res.json({ success: true, data });
  },
};
