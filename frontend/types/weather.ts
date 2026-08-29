export type WeatherSeverity = "info" | "watch" | "warning" | "critical";

export interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
  region?: string;
  country?: string;
  timezone?: string;
  farmLocation: string;
  farmName: string;
}

export interface WeatherCurrentConditions {
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKph: number;
  rainfallMm: number;
  precipitationProbabilityPercent: number;
  condition: string;
  conditionCode: number;
  sunrise?: string;
  sunset?: string;
  observedAt: string;
}

export interface WeatherTodaySummary {
  highC: number;
  lowC: number;
  rainfallMm: number;
  precipProbabilityMax: number;
}

export interface WeatherHourlyItem {
  time: string;
  temperatureC: number;
  feelsLikeC?: number;
  humidityPercent?: number;
  windKph?: number;
  rainfallMm: number;
  precipitationProbabilityPercent: number;
  condition: string;
  conditionCode: number;
}

export interface WeatherDailyItem {
  date: string;
  highC: number;
  lowC: number;
  rainfallMm: number;
  precipProbabilityMax: number;
  windMaxKph?: number;
  condition: string;
  conditionCode: number;
  sunrise?: string;
  sunset?: string;
}

export interface WeatherRecommendation {
  id: string;
  title: string;
  description: string;
  severity: WeatherSeverity;
  reason: string;
  recommendedAction: string;
  validUntil: string;
  cropType?: string;
  growthStage?: string;
  season?: string;
  ruleId?: string;
  timing?: string;
  cropId?: string;
  fieldId?: string;
  fieldName?: string;
  farmId?: string;
}

export interface WeatherRisk {
  id: string;
  label: string;
  severity: WeatherSeverity;
  detail: string;
}

export interface WeatherMeta {
  provider: string;
  fetchedAt: string;
  expiresAt: string;
  stale: boolean;
  cacheHit: boolean;
  rateLimited?: boolean;
}

export interface WeatherCropContext {
  cropType: string;
  growthStage: string;
  season: string;
}

export interface WeatherCurrentPayload {
  location: WeatherLocation;
  current: WeatherCurrentConditions;
  today: WeatherTodaySummary;
  hourlyPreview: WeatherHourlyItem[];
  recommendations: WeatherRecommendation[];
  risks: WeatherRisk[];
  cropContexts: WeatherCropContext[];
  meta: WeatherMeta;
}

export interface WeatherForecastPayload {
  location: WeatherLocation;
  hourly: WeatherHourlyItem[];
  daily: WeatherDailyItem[];
  recommendations: WeatherRecommendation[];
  risks: WeatherRisk[];
  cropContexts: WeatherCropContext[];
  meta: WeatherMeta;
}

export function weatherSeverityLabel(severity: WeatherSeverity): string {
  if (severity === "critical") return "Critical";
  if (severity === "warning") return "Warning";
  if (severity === "watch") return "Watch";
  return "Info";
}

export function weatherSeverityTone(
  severity: WeatherSeverity,
): "danger" | "warning" | "info" | "success" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  if (severity === "watch") return "warning";
  return "info";
}
