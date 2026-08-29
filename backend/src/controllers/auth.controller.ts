import type { Response } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { profileService } from "../services/profile.service";
import { userActivityService } from "../services/userActivity.service";
import { ApiError } from "../utils/ApiError";
import type { AuthedRequest } from "../middleware/auth";

const landUnitSchema = z.enum(["hectares", "acres"]);
const tempUnitSchema = z.enum(["celsius", "fahrenheit"]);
const farmingTypeSchema = z.enum([
  "crop",
  "horticulture",
  "orchard",
  "mixed",
  "livestock",
  "other",
]);

const notificationsSchema = z
  .object({
    weatherAlerts: z.boolean().optional(),
    diseaseAlerts: z.boolean().optional(),
    taskReminders: z.boolean().optional(),
    treatmentReminders: z.boolean().optional(),
    generalNotifications: z.boolean().optional(),
  })
  .optional();

const preferencesSchema = z
  .object({
    temperatureUnit: tempUnitSchema.optional(),
    landUnit: landUnitSchema.optional(),
    notifications: notificationsSchema,
  })
  .optional();

const farmSchema = z
  .object({
    name: z.string().min(2).max(120),
    location: z.string().min(2).max(200),
    size: z.number().positive().max(100000),
    unit: landUnitSchema,
    farmingType: farmingTypeSchema,
  })
  .nullable()
  .optional();

const bootstrapSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  farm: farmSchema,
  crops: z.array(z.string().min(1).max(40)).max(20).optional(),
  preferences: preferencesSchema,
  skipFarmSetup: z.boolean().optional(),
});

const profileUpdateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().max(30).optional(),
  avatarUrl: z.string().min(1).nullable().optional(),
  farm: z
    .object({
      name: z.string().min(2).max(120).optional(),
      location: z.string().max(200).optional(),
      size: z.number().min(0).max(100000).optional(),
      unit: landUnitSchema.optional(),
      farmingType: farmingTypeSchema.optional(),
    })
    .optional(),
  crops: z.array(z.string().min(1).max(40)).max(20).optional(),
  preferences: preferencesSchema,
});

function fieldErrors(error: z.ZodError) {
  return error.flatten().fieldErrors as Record<string, string[]>;
}

export const authController = {
  async bootstrap(req: AuthedRequest, res: Response) {
    const parsed = bootstrapSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid bootstrap payload",
        fieldErrors(parsed.error),
      );
    }
    if (!req.userId) throw new ApiError(401, "Authentication required");
    if (!req.userEmail) {
      throw new ApiError(
        401,
        "Authenticated email is required. Sign in with an email account.",
      );
    }
    const tokenEmail = req.userEmail.toLowerCase().trim();
    const bodyEmail = parsed.data.email.toLowerCase().trim();
    if (bodyEmail !== tokenEmail) {
      throw new ApiError(403, "Email does not match authenticated account");
    }
    const data = await authService.bootstrap(
      req.userId,
      tokenEmail,
      parsed.data as Parameters<typeof authService.bootstrap>[2],
    );
    res.status(201).json({ success: true, data });
  },

  async me(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const data = await authService.me(req.userId);
    res.json({ success: true, data });
  },

  async sessionStart(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    await userActivityService.recordSessionStart(req.userId);
    res.json({ success: true, data: { recorded: true } });
  },

  async activity(req: AuthedRequest, res: Response) {
    if (!req.userId) throw new ApiError(401, "Authentication required");
    await userActivityService.recordActivity(req.userId);
    res.json({ success: true, data: { recorded: true } });
  },

  async logout(_req: AuthedRequest, res: Response) {
    const data = await authService.logout();
    res.json({ success: true, data });
  },

  async updateProfile(req: AuthedRequest, res: Response) {
    const parsed = profileUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "Invalid profile payload",
        fieldErrors(parsed.error),
      );
    }
    if (!req.userId) throw new ApiError(401, "Authentication required");
    const data = await profileService.update(
      req.userId,
      parsed.data as Parameters<typeof profileService.update>[1],
    );
    res.json({ success: true, data, message: "Profile updated" });
  },
};
