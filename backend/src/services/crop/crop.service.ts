import { randomUUID } from "crypto";
import type {
  CropHealthStatus,
  CropRecord,
  GrowthStage,
  PublicCrop,
  YieldUnit,
} from "../../models/crop";
import type { LandUnit } from "../../models/user";
import {
  cropRepository,
  diseaseAssessmentRepository,
  farmRepository,
  fieldRepository,
  taskRepository,
  yieldRepository,
} from "../../repositories";
import { ApiError } from "../../utils/ApiError";
import { toPublicCrop } from "./mappers";

export interface CreateCropInput {
  fieldId: string;
  name: string;
  variety?: string;
  area?: number;
  areaUnit?: LandUnit;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: GrowthStage;
  expectedYield: number;
  actualYield?: number | null;
  yieldUnit?: YieldUnit;
  season: string;
  year: number;
  healthStatus?: CropHealthStatus;
  healthScore?: number;
  notes?: string;
}

export interface UpdateCropInput {
  fieldId?: string;
  name?: string;
  variety?: string;
  area?: number;
  areaUnit?: LandUnit;
  plantingDate?: string;
  expectedHarvestDate?: string;
  growthStage?: GrowthStage;
  expectedYield?: number;
  actualYield?: number | null;
  yieldUnit?: YieldUnit;
  season?: string;
  year?: number;
  healthStatus?: CropHealthStatus;
  healthScore?: number;
  notes?: string;
}

async function resolveFieldName(fieldId: string, userId: string) {
  const field = await fieldRepository.findByIdForUser(fieldId, userId);
  if (!field) throw new ApiError(400, "Field not found for this farm");
  return field;
}

export const cropService = {
  async list(userId: string): Promise<PublicCrop[]> {
    const crops = await cropRepository.listByUser(userId);
    const fields = await fieldRepository.listByUser(userId);
    const fieldMap = new Map(fields.map((f) => [f.id, f.name]));
    return crops
      .map((c) => toPublicCrop(c, fieldMap.get(c.fieldId) || "Unknown field"))
      .sort(
        (a, b) =>
          a.name.localeCompare(b.name) ||
          a.fieldName.localeCompare(b.fieldName),
      );
  },

  async get(userId: string, id: string): Promise<PublicCrop> {
    const crop = await cropRepository.findByIdForUser(id, userId);
    if (!crop) throw new ApiError(404, "Crop not found");
    const field = await fieldRepository.findByIdForUser(crop.fieldId, userId);
    return toPublicCrop(crop, field?.name || "Unknown field");
  },

  async create(userId: string, input: CreateCropInput): Promise<PublicCrop> {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) throw new ApiError(404, "Farm profile not found");
    const field = await resolveFieldName(input.fieldId, userId);

    const now = new Date().toISOString();
    const crop: CropRecord = {
      id: randomUUID(),
      userId,
      farmId: farm.id,
      fieldId: field.id,
      name: input.name.trim(),
      variety: input.variety?.trim(),
      area: input.area ?? field.area,
      areaUnit: input.areaUnit || field.areaUnit,
      plantingDate: input.plantingDate,
      expectedHarvestDate: input.expectedHarvestDate,
      growthStage: input.growthStage,
      expectedYield: input.expectedYield,
      actualYield: input.actualYield ?? null,
      yieldUnit: input.yieldUnit || "kg",
      season: input.season.trim().toLowerCase(),
      year: input.year,
      healthStatus: input.healthStatus || "healthy",
      healthScore: input.healthScore ?? 85,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    };

    await cropRepository.create(crop);

    if (crop.actualYield != null) {
      await yieldRepository.create({
        id: randomUUID(),
        userId,
        farmId: farm.id,
        cropId: crop.id,
        fieldId: field.id,
        cropName: crop.name,
        fieldName: field.name,
        season: crop.season,
        year: crop.year,
        periodLabel: `${crop.season} ${crop.year}`,
        periodDate: crop.expectedHarvestDate,
        expectedYield: crop.expectedYield,
        actualYield: crop.actualYield,
        yieldUnit: crop.yieldUnit,
        area: crop.area,
        areaUnit: crop.areaUnit,
        createdAt: now,
        updatedAt: now,
      });
    }

    return toPublicCrop(crop, field.name);
  },

  async update(
    userId: string,
    id: string,
    input: UpdateCropInput,
  ): Promise<PublicCrop> {
    const existing = await cropRepository.findByIdForUser(id, userId);
    if (!existing) throw new ApiError(404, "Crop not found");

    let fieldId = existing.fieldId;
    let fieldName =
      (await fieldRepository.findByIdForUser(fieldId, userId))?.name ||
      "Unknown field";

    if (input.fieldId && input.fieldId !== existing.fieldId) {
      const field = await resolveFieldName(input.fieldId, userId);
      fieldId = field.id;
      fieldName = field.name;
    }

    const patch: Partial<CropRecord> = {
      fieldId,
      name: input.name?.trim() ?? existing.name,
      variety:
        input.variety !== undefined
          ? input.variety.trim() || undefined
          : existing.variety,
      area: input.area ?? existing.area,
      areaUnit: input.areaUnit ?? existing.areaUnit,
      plantingDate: input.plantingDate ?? existing.plantingDate,
      expectedHarvestDate:
        input.expectedHarvestDate ?? existing.expectedHarvestDate,
      growthStage: input.growthStage ?? existing.growthStage,
      expectedYield: input.expectedYield ?? existing.expectedYield,
      actualYield:
        input.actualYield !== undefined
          ? input.actualYield
          : existing.actualYield,
      yieldUnit: input.yieldUnit ?? existing.yieldUnit,
      season: input.season?.trim().toLowerCase() ?? existing.season,
      year: input.year ?? existing.year,
      healthStatus: input.healthStatus ?? existing.healthStatus,
      healthScore: input.healthScore ?? existing.healthScore,
      notes:
        input.notes !== undefined
          ? input.notes.trim() || undefined
          : existing.notes,
    };

    const updated = await cropRepository.update(id, userId, patch);
    if (!updated) throw new ApiError(404, "Crop not found");

    // When actual yield is newly set/changed, append a yield observation
    if (
      input.actualYield != null &&
      input.actualYield !== existing.actualYield
    ) {
      const now = new Date().toISOString();
      await yieldRepository.create({
        id: randomUUID(),
        userId,
        farmId: updated.farmId,
        cropId: updated.id,
        fieldId: updated.fieldId,
        cropName: updated.name,
        fieldName,
        season: updated.season,
        year: updated.year,
        periodLabel: `${updated.season} ${updated.year}`,
        periodDate: updated.expectedHarvestDate || now.slice(0, 10),
        expectedYield: updated.expectedYield,
        actualYield: updated.actualYield ?? 0,
        yieldUnit: updated.yieldUnit,
        area: updated.area,
        areaUnit: updated.areaUnit,
        createdAt: now,
        updatedAt: now,
      });
    }

    return toPublicCrop(updated, fieldName);
  },

  async remove(userId: string, id: string) {
    const existing = await cropRepository.findByIdForUser(id, userId);
    if (!existing) throw new ApiError(404, "Crop not found");

    const [yieldCount, assessmentCount, tasks] = await Promise.all([
      yieldRepository.countByCropId(userId, id),
      diseaseAssessmentRepository.countByCropRecordId(userId, id),
      taskRepository.listByUser(userId),
    ]);

    const openTasks = tasks.filter(
      (t) =>
        t.cropRecordId === id &&
        t.status !== "completed" &&
        t.status !== "skipped",
    );

    const blockers: string[] = [];
    if (yieldCount > 0) blockers.push("yield history");
    if (assessmentCount > 0) blockers.push("disease assessments");
    if (openTasks.length > 0) blockers.push("open tasks");

    if (blockers.length) {
      throw new ApiError(
        409,
        `Cannot delete this crop because it has ${blockers.join(" and ")}. Historical records are preserved, archive or complete related work first.`,
      );
    }

    const ok = await cropRepository.delete(id, userId);
    if (!ok) throw new ApiError(404, "Crop not found");
    return { message: "Crop deleted" };
  },
};
