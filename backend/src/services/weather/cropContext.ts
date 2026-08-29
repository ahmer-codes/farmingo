import type { CropContext } from "./types";

/**
 * Season & growth-stage heuristics for South Asia / Pakistan cropping calendars.
 * Transparent and deterministic, not ML / random.
 */
export function resolveSeason(date = new Date()): CropContext["season"] {
  const month = date.getMonth() + 1;
  // Rabi: Nov–Apr · Kharif: May–Oct
  if (month >= 11 || month <= 4) return "rabi";
  if (month >= 7 && month <= 9) return "monsoon";
  return "kharif";
}

export function resolveGrowthStage(
  cropType: string,
  season: string,
  date = new Date(),
): string {
  const crop = cropType.toLowerCase();
  const month = date.getMonth() + 1;

  if (crop.includes("wheat")) {
    if (month === 11 || month === 12) return "establishment";
    if (month === 1 || month === 2) return "tillering";
    if (month === 3) return "heading";
    if (month === 4) return "grain_filling";
    return "off_season";
  }

  if (crop.includes("rice")) {
    if (month === 5 || month === 6) return "transplanting";
    if (month === 7 || month === 8) return "vegetative";
    if (month === 9) return "heading";
    if (month === 10) return "grain_filling";
    return "off_season";
  }

  if (crop.includes("cotton")) {
    if (month === 4 || month === 5) return "establishment";
    if (month === 6 || month === 7) return "vegetative";
    if (month === 8 || month === 9) return "flowering";
    if (month === 10 || month === 11) return "boll_development";
    return "off_season";
  }

  if (crop.includes("corn") || crop.includes("maize")) {
    if (month === 2 || month === 3 || month === 7) return "establishment";
    if (month === 4 || month === 8) return "vegetative";
    if (month === 5 || month === 9) return "tasseling";
    if (month === 6 || month === 10) return "grain_filling";
    return "off_season";
  }

  if (crop.includes("sugarcane")) {
    if (season === "rabi") return "establishment";
    if (season === "monsoon") return "grand_growth";
    return "vegetative";
  }

  if (
    crop.includes("tomato") ||
    crop.includes("potato") ||
    crop.includes("onion")
  ) {
    if (season === "rabi") {
      if (month === 11 || month === 12) return "establishment";
      if (month <= 2) return "vegetative";
      return "fruiting";
    }
    return "vegetative";
  }

  // Generic fallback by season
  if (season === "rabi") return month <= 2 ? "vegetative" : "reproductive";
  if (season === "monsoon") return "vegetative";
  return "vegetative";
}

export function buildCropContexts(
  primaryCrops: string[],
  date = new Date(),
): CropContext[] {
  const season = resolveSeason(date);
  const crops = primaryCrops.length ? primaryCrops : ["General field crops"];
  return crops.map((cropType) => ({
    cropType,
    season,
    growthStage: resolveGrowthStage(cropType, season, date),
  }));
}

export function buildCropContextsFromRecords(
  crops: Array<{
    id: string;
    farmId: string;
    fieldId: string;
    name: string;
    growthStage: string;
    season: string;
    healthStatus: string;
  }>,
  fieldNames: Map<string, string>,
  date = new Date(),
): CropContext[] {
  if (!crops.length) return [];
  return crops.map((crop) => ({
    cropType: crop.name,
    season: crop.season || resolveSeason(date),
    growthStage: crop.growthStage,
    cropId: crop.id,
    fieldId: crop.fieldId,
    fieldName: fieldNames.get(crop.fieldId) || "Field",
    farmId: crop.farmId,
    healthStatus: crop.healthStatus,
  }));
}

export function formatGrowthStage(stage: string): string {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
