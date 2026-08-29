import type { LandUnit } from "../../models/user";
import type {
  CropRecord,
  FieldRecord,
  GrowthStage,
  PublicCrop,
  PublicCropSummary,
  PublicField,
  PublicYieldRecord,
  YieldRecord,
  YieldUnit,
} from "../../models/crop";

export function toHectares(area: number, unit: LandUnit): number {
  return unit === "acres"
    ? Number((area * 0.404686).toFixed(3))
    : Number(area.toFixed(3));
}

export function toPublicCrop(crop: CropRecord, fieldName: string): PublicCrop {
  return {
    id: crop.id,
    farmId: crop.farmId,
    fieldId: crop.fieldId,
    fieldName,
    name: crop.name,
    variety: crop.variety,
    area: crop.area,
    areaUnit: crop.areaUnit,
    areaHa: toHectares(crop.area, crop.areaUnit),
    plantingDate: crop.plantingDate,
    expectedHarvestDate: crop.expectedHarvestDate,
    growthStage: crop.growthStage,
    expectedYield: crop.expectedYield,
    actualYield: crop.actualYield,
    yieldUnit: crop.yieldUnit,
    season: crop.season,
    year: crop.year,
    healthStatus: crop.healthStatus,
    healthScore: crop.healthScore,
    notes: crop.notes,
    createdAt: crop.createdAt,
    updatedAt: crop.updatedAt,
  };
}

export function toCropSummary(crop: CropRecord): PublicCropSummary {
  return {
    id: crop.id,
    name: crop.name,
    variety: crop.variety,
    growthStage: crop.growthStage,
    healthStatus: crop.healthStatus,
    healthScore: crop.healthScore,
    expectedYield: crop.expectedYield,
    actualYield: crop.actualYield,
    yieldUnit: crop.yieldUnit,
    season: crop.season,
    year: crop.year,
  };
}

export function toPublicField(
  field: FieldRecord,
  crop?: CropRecord | null,
): PublicField {
  return {
    id: field.id,
    farmId: field.farmId,
    name: field.name,
    area: field.area,
    areaUnit: field.areaUnit,
    areaHa: toHectares(field.area, field.areaUnit),
    layoutRow: field.layoutRow,
    layoutCol: field.layoutCol,
    layoutSpan: field.layoutSpan ?? 1,
    notes: field.notes,
    geo: field.geo,
    crop: crop ? toCropSummary(crop) : null,
    createdAt: field.createdAt,
    updatedAt: field.updatedAt,
  };
}

export function toPublicYield(record: YieldRecord): PublicYieldRecord {
  const areaHa = toHectares(record.area, record.areaUnit);
  return {
    id: record.id,
    cropId: record.cropId,
    fieldId: record.fieldId,
    cropName: record.cropName,
    fieldName: record.fieldName,
    season: record.season,
    year: record.year,
    periodLabel: record.periodLabel,
    periodDate: record.periodDate,
    expectedYield: record.expectedYield,
    actualYield: record.actualYield,
    yieldUnit: record.yieldUnit,
    area: record.area,
    areaUnit: record.areaUnit,
    areaHa,
    yieldPerHa:
      areaHa > 0 ? Number((record.actualYield / areaHa).toFixed(1)) : 0,
    notes: record.notes,
    createdAt: record.createdAt,
  };
}

export function normalizeYieldUnit(unit: YieldUnit): YieldUnit {
  return unit;
}

export type { GrowthStage };
