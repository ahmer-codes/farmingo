import { randomUUID } from "crypto";
import type { PublicYieldRecord, YieldUnit } from "../../models/crop";
import {
  cropRepository,
  farmRepository,
  fieldRepository,
  yieldRepository,
} from "../../repositories";
import { ApiError } from "../../utils/ApiError";
import { toHectares, toPublicYield } from "./mappers";

export interface YieldFilters {
  crop?: string;
  field?: string;
  season?: string;
  year?: number;
}

export interface CreateYieldInput {
  cropId: string;
  periodLabel: string;
  periodDate: string;
  expectedYield: number;
  actualYield: number;
  yieldUnit?: YieldUnit;
  season?: string;
  year?: number;
  notes?: string;
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
    overTime: Array<{ label: string; expected: number; actual: number }>;
    expectedVsActual: Array<{
      label: string;
      expected: number;
      actual: number;
    }>;
    byCrop: Array<{
      label: string;
      expected: number;
      actual: number;
      yieldPerHa: number;
    }>;
    byField: Array<{
      label: string;
      expected: number;
      actual: number;
      yieldPerHa: number;
    }>;
  };
  records: PublicYieldRecord[];
}

function matchesFilters(
  row: {
    cropName: string;
    fieldName: string;
    season: string;
    year: number;
  },
  filters: YieldFilters,
) {
  if (filters.crop && row.cropName.toLowerCase() !== filters.crop.toLowerCase())
    return false;
  if (
    filters.field &&
    row.fieldName.toLowerCase() !== filters.field.toLowerCase()
  )
    return false;
  if (
    filters.season &&
    row.season.toLowerCase() !== filters.season.toLowerCase()
  )
    return false;
  if (filters.year != null && row.year !== filters.year) return false;
  return true;
}

function aggregateBy(
  rows: PublicYieldRecord[],
  keyFn: (r: PublicYieldRecord) => string,
) {
  const map = new Map<
    string,
    { expected: number; actual: number; areaHa: number }
  >();
  for (const row of rows) {
    const key = keyFn(row);
    const current = map.get(key) || { expected: 0, actual: 0, areaHa: 0 };
    current.expected += row.expectedYield;
    current.actual += row.actualYield;
    current.areaHa += row.areaHa;
    map.set(key, current);
  }
  return Array.from(map.entries()).map(([label, v]) => ({
    label,
    expected: Number(v.expected.toFixed(1)),
    actual: Number(v.actual.toFixed(1)),
    yieldPerHa: v.areaHa > 0 ? Number((v.actual / v.areaHa).toFixed(1)) : 0,
  }));
}

export const yieldAnalyticsService = {
  async list(
    userId: string,
    filters: YieldFilters = {},
  ): Promise<PublicYieldRecord[]> {
    const rows = await yieldRepository.listByUser(userId);
    return rows
      .map(toPublicYield)
      .filter((r) => matchesFilters(r, filters))
      .sort((a, b) => a.periodDate.localeCompare(b.periodDate));
  },

  async create(
    userId: string,
    input: CreateYieldInput,
  ): Promise<PublicYieldRecord> {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) throw new ApiError(404, "Farm profile not found");
    const crop = await cropRepository.findByIdForUser(input.cropId, userId);
    if (!crop) throw new ApiError(400, "Crop not found");
    const field = await fieldRepository.findByIdForUser(crop.fieldId, userId);
    if (!field) throw new ApiError(400, "Field not found");

    const now = new Date().toISOString();
    const record = await yieldRepository.create({
      id: randomUUID(),
      userId,
      farmId: farm.id,
      cropId: crop.id,
      fieldId: field.id,
      cropName: crop.name,
      fieldName: field.name,
      season: (input.season || crop.season).toLowerCase(),
      year: input.year ?? crop.year,
      periodLabel: input.periodLabel.trim(),
      periodDate: input.periodDate,
      expectedYield: input.expectedYield,
      actualYield: input.actualYield,
      yieldUnit: input.yieldUnit || crop.yieldUnit,
      area: crop.area,
      areaUnit: crop.areaUnit,
      notes: input.notes?.trim(),
      createdAt: now,
      updatedAt: now,
    });

    // Keep crop actual yield in sync with latest observation
    await cropRepository.update(crop.id, userId, {
      actualYield: input.actualYield,
      expectedYield: input.expectedYield,
    });

    return toPublicYield(record);
  },

  async analytics(
    userId: string,
    filters: YieldFilters = {},
  ): Promise<YieldAnalytics> {
    const farm = await farmRepository.findByOwnerId(userId);
    const all = await yieldRepository.listByUser(userId);
    const publicAll = all.map(toPublicYield);
    const records = publicAll.filter((r) => matchesFilters(r, filters));

    const crops = await cropRepository.listByUser(userId);
    const fields = await fieldRepository.listByUser(userId);

    // If no yield history yet, synthesize from current crop expected/actual for dashboard bootstrap
    let working = records;
    if (
      !working.length &&
      !filters.crop &&
      !filters.field &&
      !filters.season &&
      !filters.year
    ) {
      working = crops
        .filter((c) => c.actualYield != null)
        .map((c) => {
          const field = fields.find((f) => f.id === c.fieldId);
          const areaHa = toHectares(c.area, c.areaUnit);
          return {
            id: `crop-${c.id}`,
            cropId: c.id,
            fieldId: c.fieldId,
            cropName: c.name,
            fieldName: field?.name || "Field",
            season: c.season,
            year: c.year,
            periodLabel: `${c.season} ${c.year}`,
            periodDate: c.expectedHarvestDate,
            expectedYield: c.expectedYield,
            actualYield: c.actualYield ?? 0,
            yieldUnit: c.yieldUnit,
            area: c.area,
            areaUnit: c.areaUnit,
            areaHa,
            yieldPerHa:
              areaHa > 0
                ? Number(((c.actualYield ?? 0) / areaHa).toFixed(1))
                : 0,
            createdAt: c.updatedAt,
          };
        });
    }

    const expectedYield = Number(
      working.reduce((s, r) => s + r.expectedYield, 0).toFixed(1),
    );
    const actualYield = Number(
      working.reduce((s, r) => s + r.actualYield, 0).toFixed(1),
    );
    const areaHa = Number(working.reduce((s, r) => s + r.areaHa, 0).toFixed(3));
    const yieldDifference = Number((actualYield - expectedYield).toFixed(1));
    const yieldDifferencePercent =
      expectedYield > 0
        ? Number(((yieldDifference / expectedYield) * 100).toFixed(1))
        : 0;
    const yieldPerHa =
      areaHa > 0 ? Number((actualYield / areaHa).toFixed(1)) : 0;
    const yieldUnit: YieldUnit = working[0]?.yieldUnit || "kg";

    const byCropPerf = aggregateBy(working, (r) => r.cropName).sort(
      (a, b) => b.yieldPerHa - a.yieldPerHa,
    );
    const best = byCropPerf[0]
      ? {
          name: byCropPerf[0].label,
          actualYield: byCropPerf[0].actual,
          yieldPerHa: byCropPerf[0].yieldPerHa,
        }
      : null;
    const lowest = byCropPerf.length
      ? {
          name: byCropPerf[byCropPerf.length - 1]!.label,
          actualYield: byCropPerf[byCropPerf.length - 1]!.actual,
          yieldPerHa: byCropPerf[byCropPerf.length - 1]!.yieldPerHa,
        }
      : null;

    const overTimeMap = new Map<
      string,
      { expected: number; actual: number; date: string }
    >();
    for (const row of working) {
      const key = row.periodLabel;
      const current = overTimeMap.get(key) || {
        expected: 0,
        actual: 0,
        date: row.periodDate,
      };
      current.expected += row.expectedYield;
      current.actual += row.actualYield;
      if (row.periodDate < current.date) current.date = row.periodDate;
      overTimeMap.set(key, current);
    }
    const overTime = Array.from(overTimeMap.entries())
      .map(([label, v]) => ({
        label,
        expected: Number(v.expected.toFixed(1)),
        actual: Number(v.actual.toFixed(1)),
        date: v.date,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(({ label, expected, actual }) => ({ label, expected, actual }));

    const landUnitLabel: "ha" | "ac" = farm?.unit === "acres" ? "ac" : "ha";

    return {
      filters: {
        crops: [
          ...new Set(
            publicAll.map((r) => r.cropName).concat(crops.map((c) => c.name)),
          ),
        ].sort(),
        fields: [
          ...new Set(
            publicAll.map((r) => r.fieldName).concat(fields.map((f) => f.name)),
          ),
        ].sort(),
        seasons: [
          ...new Set(
            publicAll.map((r) => r.season).concat(crops.map((c) => c.season)),
          ),
        ].sort(),
        years: [
          ...new Set(
            publicAll.map((r) => r.year).concat(crops.map((c) => c.year)),
          ),
        ].sort((a, b) => b - a),
      },
      summary: {
        expectedYield,
        actualYield,
        yieldDifference,
        yieldDifferencePercent,
        yieldPerHa,
        areaHa,
        yieldUnit,
        landUnitLabel,
        bestPerformingCrop: best,
        lowestPerformingCrop: lowest,
        recordCount: working.length,
      },
      charts: {
        overTime,
        expectedVsActual: aggregateBy(working, (r) => r.cropName),
        byCrop: aggregateBy(working, (r) => r.cropName),
        byField: aggregateBy(working, (r) => r.fieldName),
      },
      records: working,
    };
  },
};
