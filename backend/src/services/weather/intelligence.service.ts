import { createHash } from "crypto";
import { formatGrowthStage } from "./cropContext";
import type {
  CropContext,
  WeatherBundle,
  WeatherRecommendation,
  WeatherRisk,
  WeatherSeverity,
} from "./types";

interface RuleContext {
  bundle: WeatherBundle;
  crop: CropContext;
  now: Date;
}

function hoursUntilRain(bundle: WeatherBundle): number | null {
  const nowMs = Date.now();
  for (const hour of bundle.hourly) {
    const t = new Date(hour.time).getTime();
    if (t <= nowMs) continue;
    if (hour.rainfallMm >= 1 || hour.precipitationProbabilityPercent >= 60) {
      return Math.max(1, Math.round((t - nowMs) / (60 * 60 * 1000)));
    }
  }
  if (bundle.daily[0]?.precipProbabilityMax >= 70) return 24;
  return null;
}

function formatTiming(hours: number | null): string | undefined {
  if (hours == null) return undefined;
  if (hours <= 6) return "Within 6 hours";
  if (hours <= 18) return `Within ${hours} hours`;
  if (hours <= 36) return "Today or tomorrow";
  return "Soon";
}

function cropFieldLabel(crop: CropContext): string {
  if (crop.fieldName) return `${crop.cropType}, ${crop.fieldName}`;
  return crop.cropType;
}

interface WeatherRule {
  id: string;
  /** Deterministic predicate, no randomness */
  matches: (ctx: RuleContext) => boolean;
  severity: WeatherSeverity | ((ctx: RuleContext) => WeatherSeverity);
  title: string | ((ctx: RuleContext) => string);
  description: (ctx: RuleContext) => string;
  reason: (ctx: RuleContext) => string;
  recommendedAction: (ctx: RuleContext) => string;
  /** Hours until recommendation expires */
  validHours: number;
  riskLabel?: string;
}

const SENSITIVE_ESTABLISHMENT = new Set([
  "establishment",
  "transplanting",
  "tillering",
]);

const FUNGAL_SENSITIVE_STAGES = new Set([
  "vegetative",
  "tillering",
  "heading",
  "flowering",
  "fruiting",
  "tasseling",
  "boll_development",
  "grain_filling",
]);

const RULES: WeatherRule[] = [
  {
    id: "rain_expected_soon",
    matches: ({ bundle }) => hoursUntilRain(bundle) != null,
    severity: "warning",
    title: (ctx) => {
      const hours = hoursUntilRain(ctx.bundle);
      return hours && hours <= 24
        ? `Rain expected in ${hours} hour${hours === 1 ? "" : "s"}`
        : "Rain expected soon";
    },
    description: ({ crop }) =>
      `Rain is forecast for ${cropFieldLabel(crop)} while the crop is in the ${formatGrowthStage(crop.growthStage)} stage.`,
    reason: ({ bundle }) => {
      const hours = hoursUntilRain(bundle);
      return hours
        ? `Forecast shows meaningful rain within ~${hours} hours for your farm location.`
        : "Forecast indicates rain in the near term.";
    },
    recommendedAction: () =>
      "Consider checking drainage channels today and avoid unnecessary irrigation before rain arrives.",
    validHours: 18,
    riskLabel: "Rain expected",
  },
  {
    id: "frost_risk",
    matches: ({ bundle }) =>
      bundle.current.temperatureC <= 2 ||
      bundle.current.feelsLikeC <= 0 ||
      bundle.today.lowC <= 2,
    severity: (ctx) => (ctx.bundle.today.lowC <= 0 ? "critical" : "warning"),
    title: "Frost / low-temperature risk",
    description: ({ crop }) =>
      `Overnight lows may damage ${crop.cropType} at the ${formatGrowthStage(crop.growthStage)} stage.`,
    reason: ({ bundle }) =>
      `Low ${bundle.today.lowC}°C (feels like ${bundle.current.feelsLikeC}°C) meets frost-risk threshold (≤2°C).`,
    recommendedAction: ({ crop }) => {
      if (SENSITIVE_ESTABLISHMENT.has(crop.growthStage)) {
        return "Cover young plants, delay irrigation that cools soil further, and check seedlings at first light.";
      }
      return "Protect sensitive crops with covers/windbreaks and postpone pruning or transplanting until temperatures rise.";
    },
    validHours: 18,
    riskLabel: "Frost risk",
  },
  {
    id: "high_temperature",
    matches: ({ bundle }) =>
      bundle.current.temperatureC >= 35 || bundle.today.highC >= 36,
    severity: (ctx) => (ctx.bundle.today.highC >= 40 ? "critical" : "warning"),
    title: "High temperature stress",
    description: ({ crop }) =>
      `Heat can stress ${crop.cropType} (${formatGrowthStage(crop.growthStage)}) and increase irrigation demand.`,
    reason: ({ bundle }) =>
      `Temperature ${bundle.current.temperatureC}°C / high ${bundle.today.highC}°C exceeds heat threshold (≥35°C).`,
    recommendedAction: () =>
      "Check irrigation timing (prefer early morning), watch for canopy wilting, and avoid midday spraying.",
    validHours: 12,
    riskLabel: "Heat stress",
  },
  {
    id: "high_humidity_fungal",
    matches: ({ bundle, crop }) =>
      bundle.current.humidityPercent >= 80 &&
      FUNGAL_SENSITIVE_STAGES.has(crop.growthStage),
    severity: "watch",
    title: "High humidity, fungal watch",
    description: ({ crop }) =>
      `Humid air may increase foliar disease pressure on ${cropFieldLabel(crop)} during ${formatGrowthStage(crop.growthStage)}.`,
    reason: ({ bundle }) =>
      `Humidity ${bundle.current.humidityPercent}% is at/above the fungal-watch threshold (80%). Conditions may increase risk, consider inspecting crops.`,
    recommendedAction: () =>
      "Consider inspecting lower leaves for spots or discoloration and improve airflow where possible.",
    validHours: 24,
    riskLabel: "Fungal disease pressure",
  },
  {
    id: "heavy_rain",
    matches: ({ bundle }) =>
      bundle.today.rainfallMm >= 25 ||
      bundle.hourly.slice(0, 6).some((h) => h.rainfallMm >= 8),
    severity: (ctx) =>
      ctx.bundle.today.rainfallMm >= 40 ? "critical" : "warning",
    title: "Heavy rain expected",
    description: ({ crop }) =>
      `Intense rain can lodge plants and flood root zones for ${crop.cropType}.`,
    reason: ({ bundle }) =>
      `Today’s rainfall ${bundle.today.rainfallMm} mm meets heavy-rain threshold (≥25 mm) or near-term hourly bursts are high.`,
    recommendedAction: () =>
      "Clear drainage channels, postpone unnecessary irrigation, and delay foliar sprays until foliage dries.",
    validHours: 18,
    riskLabel: "Heavy rain",
  },
  {
    id: "waterlogging",
    matches: ({ bundle }) => {
      const next3 = bundle.daily
        .slice(0, 3)
        .reduce((sum, d) => sum + d.rainfallMm, 0);
      return next3 >= 50 || bundle.today.rainfallMm >= 40;
    },
    severity: "warning",
    title: "Waterlogging risk",
    description: ({ crop }) =>
      `Accumulated rainfall raises waterlogging risk for ${crop.cropType} roots.`,
    reason: ({ bundle }) => {
      const next3 = bundle.daily
        .slice(0, 3)
        .reduce((sum, d) => sum + d.rainfallMm, 0);
      return `3-day rainfall total ${round1(next3)} mm (or today ${bundle.today.rainfallMm} mm) exceeds waterlogging threshold.`;
    },
    recommendedAction: () =>
      "Monitor low-lying fields, open outlets, and avoid heavy machinery on saturated soils.",
    validHours: 36,
    riskLabel: "Waterlogging",
  },
  {
    id: "strong_winds",
    matches: ({ bundle }) =>
      bundle.current.windKph >= 40 ||
      bundle.daily.slice(0, 2).some((d) => (d.windMaxKph ?? 0) >= 45),
    severity: (ctx) =>
      ctx.bundle.current.windKph >= 55 ? "critical" : "warning",
    title: "Strong wind precaution",
    description: ({ crop }) =>
      `Gusty winds can damage ${crop.cropType} supports, flowers, and young shoots.`,
    reason: ({ bundle }) =>
      `Wind ${bundle.current.windKph} kph (or forecast max ≥45 kph) exceeds strong-wind threshold (≥40 kph).`,
    recommendedAction: () =>
      "Inspect stakes/trellises, postpone spraying, and secure shade nets or tunnel covers.",
    validHours: 12,
    riskLabel: "Strong winds",
  },
  {
    id: "high_precip_probability",
    matches: ({ bundle, crop }) =>
      bundle.today.precipProbabilityMax >= 70 &&
      (SENSITIVE_ESTABLISHMENT.has(crop.growthStage) ||
        crop.growthStage === "flowering" ||
        crop.growthStage === "heading"),
    severity: "info",
    title: "Likely rain, field timing",
    description: ({ crop }) =>
      `Rain is likely during a sensitive stage (${formatGrowthStage(crop.growthStage)}) for ${crop.cropType}.`,
    reason: ({ bundle }) =>
      `Precipitation probability ${bundle.today.precipProbabilityMax}% is at/above 70% during a sensitive growth stage.`,
    recommendedAction: () =>
      "Schedule fertilizer/sprays for a dry window and prepare drainage before peak rain hours.",
    validHours: 24,
    riskLabel: "Rain likely",
  },
  {
    id: "monsoon_humidity_combo",
    matches: ({ bundle, crop }) =>
      crop.season === "monsoon" &&
      bundle.current.humidityPercent >= 75 &&
      bundle.today.precipProbabilityMax >= 50,
    severity: "watch",
    title: "Monsoon disease pressure",
    description: ({ crop }) =>
      `Monsoon humidity plus rain chances raise disease pressure on ${crop.cropType}.`,
    reason: ({ bundle, crop }) =>
      `Season is monsoon with humidity ${bundle.current.humidityPercent}% and rain chance ${bundle.today.precipProbabilityMax}%.`,
    recommendedAction: () =>
      "Increase scouting frequency, avoid dense canopy wetting late day, and keep treatment tasks ready if lesions appear.",
    validHours: 24,
    riskLabel: "Monsoon disease pressure",
  },
  {
    id: "dry_heat_irrigation",
    matches: ({ bundle }) =>
      bundle.current.temperatureC >= 32 &&
      bundle.today.rainfallMm < 2 &&
      bundle.today.precipProbabilityMax < 30 &&
      bundle.current.humidityPercent <= 45,
    severity: "info",
    title: "Hot & dry, irrigation check",
    description: ({ crop }) =>
      `Dry heat increases soil moisture loss for ${crop.cropType}.`,
    reason: ({ bundle }) =>
      `Temp ≥32°C, humidity ≤45%, and low rain chance (<30%) with little rain today.`,
    recommendedAction: () =>
      "Check soil moisture at 10–15 cm and irrigate early if the profile is dry; avoid afternoon irrigation.",
    validHours: 12,
    riskLabel: "Dry heat",
  },
];

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function recommendationId(
  ruleId: string,
  cropType: string,
  dateKey: string,
): string {
  return createHash("sha1")
    .update(`${ruleId}|${cropType}|${dateKey}`)
    .digest("hex")
    .slice(0, 12);
}

function severityRank(s: WeatherSeverity): number {
  if (s === "critical") return 4;
  if (s === "warning") return 3;
  if (s === "watch") return 2;
  return 1;
}

/**
 * Rule-based weather intelligence for farming recommendations.
 * Every recommendation cites an explicit threshold in `reason`.
 */
export const weatherIntelligenceService = {
  analyze(bundle: WeatherBundle, crops: CropContext[], now = new Date()) {
    const contexts = crops.length
      ? crops
      : [
          {
            cropType: "General field crops",
            season: "kharif",
            growthStage: "vegetative",
          },
        ];
    const dateKey = now.toISOString().slice(0, 10);
    const byRule = new Map<
      string,
      {
        rule: WeatherRule;
        severity: WeatherSeverity;
        samples: RuleContext[];
      }
    >();
    const riskMap = new Map<string, WeatherRisk>();

    for (const crop of contexts) {
      const ctx: RuleContext = { bundle, crop, now };

      for (const rule of RULES) {
        if (!rule.matches(ctx)) continue;

        const severity =
          typeof rule.severity === "function"
            ? rule.severity(ctx)
            : rule.severity;

        const existing = byRule.get(rule.id);
        if (!existing) {
          byRule.set(rule.id, { rule, severity, samples: [ctx] });
        } else {
          existing.samples.push(ctx);
          if (severityRank(severity) > severityRank(existing.severity)) {
            existing.severity = severity;
          }
        }

        if (rule.riskLabel) {
          const prior = riskMap.get(rule.id);
          if (!prior || severityRank(severity) > severityRank(prior.severity)) {
            riskMap.set(rule.id, {
              id: rule.id,
              label: rule.riskLabel,
              severity,
              detail: rule.reason(ctx),
            });
          }
        }
      }
    }

    const recommendations: WeatherRecommendation[] = Array.from(
      byRule.values(),
    ).map(({ rule, severity, samples }) => {
      const primary = samples[0]!;
      const cropNames = [...new Set(samples.map((s) => s.crop.cropType))];
      const title =
        typeof rule.title === "function" ? rule.title(primary) : rule.title;
      const validUntil = new Date(
        now.getTime() + rule.validHours * 60 * 60 * 1000,
      ).toISOString();
      const rainHours = rule.id.includes("rain")
        ? hoursUntilRain(bundle)
        : null;

      const descriptionBase = rule.description(primary);
      const description =
        cropNames.length > 1
          ? `${descriptionBase} Affects: ${cropNames.join(", ")}.`
          : descriptionBase;

      return {
        id: recommendationId(rule.id, cropNames.join(","), dateKey),
        title,
        description,
        severity,
        reason: rule.reason(primary),
        recommendedAction: rule.recommendedAction(primary),
        validUntil,
        cropType: primary.crop.cropType,
        growthStage: samples[0]!.crop.growthStage,
        season: samples[0]!.crop.season,
        ruleId: rule.id,
        timing: formatTiming(rainHours),
        cropId: primary.crop.cropId,
        fieldId: primary.crop.fieldId,
        fieldName: primary.crop.fieldName,
        farmId: primary.crop.farmId,
      };
    });

    recommendations.sort(
      (a, b) =>
        severityRank(b.severity) - severityRank(a.severity) ||
        a.title.localeCompare(b.title),
    );

    const risks = Array.from(riskMap.values()).sort(
      (a, b) => severityRank(b.severity) - severityRank(a.severity),
    );

    return {
      recommendations,
      risks,
      cropContexts: contexts,
    };
  },
};
