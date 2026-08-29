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

export interface FieldGeoMeta {
  referencePoint?: { latitude: number; longitude: number } | null;
  boundaryGeoJson?: Record<string, unknown> | null;
  imageryReady?: boolean;
  coordinateSystem?: string | null;
  source?: "manual" | "gps_survey" | "cadastral" | "unknown" | null;
}

export interface CropSummary {
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

export interface FarmField {
  id: string;
  farmId: string;
  name: string;
  area: number;
  areaUnit: "hectares" | "acres";
  areaHa: number;
  layoutRow: number;
  layoutCol: number;
  layoutSpan: number;
  notes?: string;
  geo: FieldGeoMeta;
  crop?: CropSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface FarmCrop {
  id: string;
  farmId: string;
  fieldId: string;
  fieldName: string;
  name: string;
  variety?: string;
  area: number;
  areaUnit: "hectares" | "acres";
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

export interface YieldObservation {
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
  areaUnit: "hectares" | "acres";
  areaHa: number;
  yieldPerHa: number;
  notes?: string;
  createdAt: string;
}

export interface YieldChartPoint {
  label: string;
  expected: number;
  actual: number;
  yieldPerHa?: number;
}

export interface YieldAnalytics {
  filters: {
    crops: string[];
    fields: string[];
    seasons: string[];
    years: number[];
  };
  summary: {
    expectedYield: number;
    actualYield: number;
    yieldDifference: number;
    yieldDifferencePercent: number;
    yieldPerHa: number;
    areaHa: number;
    yieldUnit: YieldUnit;
    landUnitLabel: "ha" | "ac";
    bestPerformingCrop: {
      name: string;
      actualYield: number;
      yieldPerHa: number;
    } | null;
    lowestPerformingCrop: {
      name: string;
      actualYield: number;
      yieldPerHa: number;
    } | null;
    recordCount: number;
  };
  charts: {
    overTime: YieldChartPoint[];
    expectedVsActual: YieldChartPoint[];
    byCrop: YieldChartPoint[];
    byField: YieldChartPoint[];
  };
  records: YieldObservation[];
}

export interface YieldAnalyticsFilter {
  crop?: string;
  field?: string;
  season?: string;
  year?: number;
}

export interface CreateCropPayload {
  fieldId: string;
  name: string;
  variety?: string;
  area?: number;
  areaUnit?: "hectares" | "acres";
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

export type UpdateCropPayload = Partial<CreateCropPayload>;

export interface CreateFieldPayload {
  name: string;
  area: number;
  areaUnit?: "hectares" | "acres";
  layoutRow?: number;
  layoutCol?: number;
  notes?: string;
}

export const GROWTH_STAGE_OPTIONS: Array<{
  value: GrowthStage;
  label: string;
}> = [
  { value: "establishment", label: "Establishment" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "grain_filling", label: "Grain filling" },
  { value: "maturity", label: "Maturity" },
  { value: "harvest", label: "Harvest" },
  { value: "fallow", label: "Fallow" },
];

export const HEALTH_STATUS_OPTIONS: Array<{
  value: CropHealthStatus;
  label: string;
}> = [
  { value: "healthy", label: "Healthy" },
  { value: "watch", label: "Needs attention" },
  { value: "at_risk", label: "At risk" },
  { value: "critical", label: "Critical" },
];

export const YIELD_UNIT_OPTIONS: Array<{ value: YieldUnit; label: string }> = [
  { value: "kg", label: "Kilograms" },
  { value: "tonnes", label: "Tonnes" },
  { value: "maunds", label: "Maunds" },
];

export function growthStageLabel(stage: GrowthStage): string {
  return GROWTH_STAGE_OPTIONS.find((o) => o.value === stage)?.label || stage;
}

export function healthStatusLabel(status: CropHealthStatus): string {
  return HEALTH_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}

/** Shorter label for tight table/badge layouts */
export function healthStatusShortLabel(status: CropHealthStatus): string {
  const map: Record<CropHealthStatus, string> = {
    healthy: "Healthy",
    watch: "Attention",
    at_risk: "At risk",
    critical: "Critical",
  };
  return map[status] || status;
}

export function healthTone(
  status: CropHealthStatus,
): "success" | "warning" | "danger" | "info" {
  if (status === "healthy") return "success";
  if (status === "watch") return "warning";
  if (status === "at_risk") return "warning";
  return "danger";
}
