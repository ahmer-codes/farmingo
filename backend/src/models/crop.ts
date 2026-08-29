import type { LandUnit } from "./user";

export type CropHealthStatus = "healthy" | "watch" | "at_risk" | "critical";
export type YieldUnit = "kg" | "tonnes" | "maunds";
export type GrowthStage =
  | "establishment"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "grain_filling"
  | "maturity"
  | "harvest"
  | "fallow";

/**
 * Optional GIS extension point, never invent precise farm boundaries.
 * Populate only when real survey / GPS / imagery data exists.
 */
export interface FieldGeoMeta {
  /** Approximate farm-level reference point only (optional) */
  referencePoint?: { latitude: number; longitude: number } | null;
  /** Real surveyed boundary when available, null until then */
  boundaryGeoJson?: Record<string, unknown> | null;
  /** Future satellite / NDVI pipeline flag */
  imageryReady?: boolean;
  coordinateSystem?: string | null;
  source?: "manual" | "gps_survey" | "cadastral" | "unknown" | null;
}

export interface FieldRecord {
  id: string;
  userId: string;
  farmId: string;
  name: string;
  area: number;
  areaUnit: LandUnit;
  /** Visual layout slot for schematic field map (not GPS) */
  layoutRow: number;
  layoutCol: number;
  layoutSpan?: number;
  notes?: string;
  geo: FieldGeoMeta;
  createdAt: string;
  updatedAt: string;
}

export interface CropRecord {
  id: string;
  userId: string;
  farmId: string;
  fieldId: string;
  name: string;
  variety?: string;
  area: number;
  areaUnit: LandUnit;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: GrowthStage;
  expectedYield: number;
  actualYield: number | null;
  yieldUnit: YieldUnit;
  season: string;
  year: number;
  healthStatus: CropHealthStatus;
  healthScore: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/** Historical / period yield observation for analytics charts */
export interface YieldRecord {
  id: string;
  userId: string;
  farmId: string;
  cropId: string;
  fieldId: string;
  cropName: string;
  fieldName: string;
  season: string;
  year: number;
  periodLabel: string;
  periodDate: string;
  expectedYield: number;
  actualYield: number;
  yieldUnit: YieldUnit;
  area: number;
  areaUnit: LandUnit;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicField {
  id: string;
  farmId: string;
  name: string;
  area: number;
  areaUnit: LandUnit;
  areaHa: number;
  layoutRow: number;
  layoutCol: number;
  layoutSpan: number;
  notes?: string;
  geo: FieldGeoMeta;
  crop?: PublicCropSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicCropSummary {
  id: string;
  name: string;
  variety?: string;
  growthStage: GrowthStage;
  healthStatus: CropHealthStatus;
  healthScore: number;
  expectedYield: number;
  actualYield: number | null;
  yieldUnit: YieldUnit;
  season: string;
  year: number;
}

export interface PublicCrop {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  name: string;
  variety?: string;
  area: number;
  areaUnit: LandUnit;
  areaHa: number;
  plantingDate: string;
  expectedHarvestDate: string;
  growthStage: GrowthStage;
  expectedYield: number;
  actualYield: number | null;
  yieldUnit: YieldUnit;
  season: string;
  year: number;
  healthStatus: CropHealthStatus;
  healthScore: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicYieldRecord {
  id: string;
  cropId: string;
  fieldId: string;
  cropName: string;
  fieldName: string;
  season: string;
  year: number;
  periodLabel: string;
  periodDate: string;
  expectedYield: number;
  actualYield: number;
  yieldUnit: YieldUnit;
  area: number;
  areaUnit: LandUnit;
  areaHa: number;
  yieldPerHa: number;
  notes?: string;
  createdAt: string;
}

export const GROWTH_STAGE_LABELS: Record<GrowthStage, string> = {
  establishment: "Establishment",
  vegetative: "Vegetative",
  flowering: "Flowering",
  fruiting: "Fruiting",
  grain_filling: "Grain filling",
  maturity: "Maturity",
  harvest: "Harvest",
  fallow: "Fallow",
};

export const HEALTH_STATUS_LABELS: Record<CropHealthStatus, string> = {
  healthy: "Healthy",
  watch: "Needs attention",
  at_risk: "At risk",
  critical: "Critical",
};
