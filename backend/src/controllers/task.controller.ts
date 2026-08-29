import type { Response } from "express";
import { z } from "zod";
import type { AuthedRequest } from "../middleware/auth";
import { taskService, type TaskListFilter } from "../services/task.service";
import { treatmentPlanService } from "../services/treatmentPlan.service";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

const prioritySchema = z.enum(["low", "medium", "high"]);
const statusSchema = z.enum(["pending", "in_progress", "completed", "skipped"]);
const sourceSchema = z.enum([
  "disease_treatment",
  "weather_precaution",
  "farmer_created",
  "seasonal_recommendation",
]);

const createSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(2).max(2000),
  crop: z.string().min(1).max(80),
  field: z.string().max(120).optional(),
  priority: prioritySchema,
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
  source: sourceSchema.optional(),
  reason: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  relatedDisease: z.string().max(160).optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

const updateSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().min(2).max(2000).optional(),
  crop: z.string().min(1).max(80).optional(),
  field: z.string().max(120).optional(),
  priority: prioritySchema.optional(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  dueTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  estimatedDurationMinutes: z
    .number()
    .int()
    .positive()
    .max(24 * 60)
    .optional(),
  status: statusSchema.optional(),
  reason: z.string().max(2000).optional(),
  instructions: z.string().max(4000).optional(),
  relatedDisease: z.string().max(160).optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

const filterSchema = z.enum([
  "all",
  "today",
  "upcoming",
  "completed",
  "overdue",
  "disease_treatment",
  "weather_precaution",
  "farmer_created",
  "seasonal_recommendation",
]);

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const taskController = {
  async list(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = filterSchema.safeParse(req.query.filter || "all");
    if (!parsed.success) throw new ApiError(400, "Invalid filter");
    const data = await taskService.list(userId, parsed.data as TaskListFilter);
    res.json({ success: true, data });
  },

  async get(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await taskService.get(userId, String(req.params.id));
    res.json({ success: true, data });
  },

  async create(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid task payload",
        fieldErrors(parsed.error),
      );
    }
    const data = await taskService.create(userId, parsed.data);
    res.status(201).json({ success: true, data });
  },

  async update(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, "Invalid task update", fieldErrors(parsed.error));
    }
    const data = await taskService.update(
      userId,
      String(req.params.id),
      parsed.data,
    );
    res.json({ success: true, data, message: "Task updated" });
  },

  async complete(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await taskService.complete(userId, String(req.params.id));
    res.json({ success: true, data, message: "Task marked complete" });
  },

  async remove(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await taskService.remove(userId, String(req.params.id));
    res.json({ success: true, data });
  },

  async getPlan(req: AuthedRequest, res: Response) {
    const userId = requireUserId(req);
    const data = await treatmentPlanService.getPlan(
      userId,
      String(req.params.id),
    );
    if (!data) throw new ApiError(404, "Treatment plan not found");
    res.json({ success: true, data });
  },
};
