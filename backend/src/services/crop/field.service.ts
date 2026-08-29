import { randomUUID } from "crypto";
import type {
  CropHealthStatus,
  FieldGeoMeta,
  GrowthStage,
  PublicField,
  YieldUnit,
} from "../../models/crop";
import type { LandUnit } from "../../models/user";
import {
  cropRepository,
  farmRepository,
  fieldRepository,
} from "../../repositories";
import { ApiError } from "../../utils/ApiError";
import { toPublicField } from "./mappers";

export interface CreateFieldInput {
  name: string;
  area: number;
  areaUnit?: LandUnit;
  layoutRow?: number;
  layoutCol?: number;
  layoutSpan?: number;
  notes?: string;
  geo?: FieldGeoMeta;
}

export interface UpdateFieldInput {
  name?: string;
  area?: number;
  areaUnit?: LandUnit;
  layoutRow?: number;
  layoutCol?: number;
  layoutSpan?: number;
  notes?: string;
  geo?: FieldGeoMeta;
}

function emptyGeo(): FieldGeoMeta {
  return {
    referencePoint: null,
    boundaryGeoJson: null,
    imageryReady: false,
    coordinateSystem: null,
    source: null,
  };
}

export const fieldService = {
  async list(userId: string): Promise<PublicField[]> {
    const fields = await fieldRepository.listByUser(userId);
    const crops = await cropRepository.listByUser(userId);
    return fields
      .map((field) => {
        const active = crops
          .filter((c) => c.fieldId === field.id)
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
        return toPublicField(field, active || null);
      })
      .sort((a, b) => a.layoutRow - b.layoutRow || a.layoutCol - b.layoutCol);
  },

  async get(userId: string, id: string): Promise<PublicField> {
    const field = await fieldRepository.findByIdForUser(id, userId);
    if (!field) throw new ApiError(404, "Field not found");
    const crops = await cropRepository.findByFieldId(id, userId);
    const active = crops.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )[0];
    return toPublicField(field, active || null);
  },

  async create(userId: string, input: CreateFieldInput): Promise<PublicField> {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) throw new ApiError(404, "Farm profile not found");

    const now = new Date().toISOString();
    const existing = await fieldRepository.listByUser(userId);
    const nextCol = existing.length % 2;
    const nextRow = Math.floor(existing.length / 2);

    const field = await fieldRepository.create({
      id: randomUUID(),
      userId,
      farmId: farm.id,
      name: input.name.trim(),
      area: input.area,
      areaUnit: input.areaUnit || farm.unit,
      layoutRow: input.layoutRow ?? nextRow,
      layoutCol: input.layoutCol ?? nextCol,
      layoutSpan: input.layoutSpan ?? 1,
      notes: input.notes?.trim(),
      geo: { ...emptyGeo(), ...(input.geo || {}) },
      createdAt: now,
      updatedAt: now,
    });

    return toPublicField(field, null);
  },

  async update(
    userId: string,
    id: string,
    input: UpdateFieldInput,
  ): Promise<PublicField> {
    const existing = await fieldRepository.findByIdForUser(id, userId);
    if (!existing) throw new ApiError(404, "Field not found");

    const updated = await fieldRepository.update(id, userId, {
      name: input.name?.trim() ?? existing.name,
      area: input.area ?? existing.area,
      areaUnit: input.areaUnit ?? existing.areaUnit,
      layoutRow: input.layoutRow ?? existing.layoutRow,
      layoutCol: input.layoutCol ?? existing.layoutCol,
      layoutSpan: input.layoutSpan ?? existing.layoutSpan,
      notes:
        input.notes !== undefined
          ? input.notes.trim() || undefined
          : existing.notes,
      geo: input.geo ? { ...existing.geo, ...input.geo } : existing.geo,
    });
    if (!updated) throw new ApiError(404, "Field not found");

    const crops = await cropRepository.findByFieldId(id, userId);
    const active = crops.sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    )[0];
    return toPublicField(updated, active || null);
  },

  async remove(userId: string, id: string) {
    const crops = await cropRepository.findByFieldId(id, userId);
    if (crops.length) {
      throw new ApiError(
        409,
        "Remove or reassign crops on this field before deleting it",
      );
    }
    const ok = await fieldRepository.delete(id, userId);
    if (!ok) throw new ApiError(404, "Field not found");
    return { message: "Field deleted" };
  },
};

export type { CropHealthStatus, GrowthStage, YieldUnit };
