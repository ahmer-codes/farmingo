export type WeatherSeverity = "info" | "watch" | "warning" | "critical";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  label: string;
  region?: string;
  country?: string;
  timezone?: string;
}

export interface CurrentWeather {
  temperatureC: number;
  feelsLikeC: number;
  humidityPercent: number;
  windKph: number;
  /** Precipitation in the last hour (mm), when available */
  rainfallMm: number;
  precipitationProbabilityPercent: number;
  condition: string;
  conditionCode: number;
  sunrise?: string;
  sunset?: string;
  observedAt: string;
}

export interface TodaySummary {
  highC: number;
  lowC: number;
  rainfallMm: number;
  precipProbabilityMax: number;
}

export interface HourlyForecastItem {
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

export interface DailyForecastItem {
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

export interface WeatherBundle {
  location: GeoCoordinates;
  current: CurrentWeather;
  today: TodaySummary;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  fetchedAt: string;
  provider: string;
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

export interface CropContext {
  cropType: string;
  growthStage: string;
  season: string;
  cropId?: string;
  fieldId?: string;
  fieldName?: string;
  farmId?: string;
  healthStatus?: string;
}

export interface WeatherProvider {
  readonly name: string;
  fetchWeather(coords: GeoCoordinates): Promise<WeatherBundle>;
}

export interface GeocodeProvider {
  geocode(query: string): Promise<GeoCoordinates | null>;
}
