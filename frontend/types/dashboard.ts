export type HealthStatus = "healthy" | "watch" | "at_risk" | "critical";
export type AlertSeverity = "info" | "warning" | "critical";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "pending" | "in_progress" | "completed" | "overdue";
export type ActivityType =
  | "crop_added"
  | "disease_assessment"
  | "task_completed"
  | "weather_alert"
  | "profile_updated"
  | "yield_logged";

export interface FarmContext {
  farmName: string;
  location: string;
  region: string;
  totalAreaHa: number;
  activeFields: number;
  landUnitLabel: string;
}

export interface HourlyForecastItem {
  time: string;
  temperatureC: number;
  condition: string;
}

export interface WeatherSnapshot {
  location: string;
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  humidityPercent: number;
  windKph: number;
  rainfallMm: number;
  rainProbabilityPercent: number;
  forecastHighC: number;
  forecastLowC: number;
  riskNote?: string;
  todayForecast: HourlyForecastItem[];
  stale?: boolean;
  rateLimited?: boolean;
}

export interface FarmOverviewMetrics {
  totalArea: { value: string; unit: string; helper: string };
  activeCrops: { value: string; helper: string };
  estimatedYield: { value: string; unit: string; helper: string };
  actualYield: { value: string; unit: string; helper: string };
  yieldAchievement: { value: string; helper: string };
  completedTasks: { value: string; helper: string };
  pendingTasks: { value: string; helper: string };
}

export interface ChartSlice {
  label: string;
  value: number;
  color?: string;
}

export interface CompareBar {
  label: string;
  expected: number;
  actual: number;
  achievementPercent?: number;
}

export interface DashboardAnalytics {
  yieldSummary: {
    expected: number;
    actual: number;
    difference: number;
    achievementPercent: number;
    unit: string;
    formattedExpected: string;
    formattedActual: string;
  };
  yieldByCrop: CompareBar[];
  yieldByField: CompareBar[];
  yieldTrend: Array<{ label: string; expected: number; actual: number }>;
  hasYieldTrend: boolean;
  healthDistribution: ChartSlice[];
  cropDistribution: Array<{ label: string; value: number; areaHa: number }>;
  healthByCrop: Array<{ label: string; score: number }>;
  tasksByStatus: ChartSlice[];
  averageHealthScore: number;
}

export interface CropHealthItem {
  id: string;
  cropName: string;
  fieldName: string;
  variety: string;
  areaHa: number;
  status: HealthStatus;
  healthScore: number;
  stage: string;
  plantingDate: string;
  estimatedHarvestDate: string;
  lastUpdated: string;
}

export interface RecommendedAction {
  id: string;
  title: string;
  detail: string;
  urgency: "now" | "today" | "soon";
  timing?: string;
  cropName?: string;
  fieldName?: string;
  fieldId?: string;
  cropId?: string;
  drivers: {
    weatherSignal: string;
    cropContext: string;
  };
}

export interface FarmAlert {
  id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  source: "weather" | "crop" | "task" | "system";
  createdAt: string;
}

export interface FarmTask {
  id: string;
  title: string;
  cropName: string;
  fieldName: string;
  dueDate: string;
  dueGroup: "overdue" | "today" | "upcoming";
  priority: TaskPriority;
  status: TaskStatus;
  treatmentType?: string;
}

export interface TaskSummary {
  overdue: FarmTask[];
  today: FarmTask[];
  upcoming: FarmTask[];
  completedThisWeek: number;
  totalThisWeek: number;
}

export interface YieldPoint {
  label: string;
  expectedKg: number;
  actualKg: number;
}

export interface YieldSeries {
  crop: string;
  season: string;
  year: number;
  points: YieldPoint[];
}

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  detail: string;
  createdAt: string;
}

export interface DashboardOverview {
  farm: FarmContext;
  weather: WeatherSnapshot | null;
  weatherError: string | null;
  weatherStatus: "idle" | "loading" | "success" | "error" | "unavailable";
  overview: FarmOverviewMetrics;
  crops: CropHealthItem[];
  recommendedActions: RecommendedAction[];
  alerts: FarmAlert[];
  tasks: TaskSummary;
  yieldSeries: YieldSeries[];
  analytics: DashboardAnalytics;
  recentActivity: ActivityItem[];
  unreadNotifications: number;
}

export function healthStatusLabel(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    healthy: "Healthy",
    watch: "Needs Attention",
    at_risk: "At Risk",
    critical: "Critical",
  };
  return map[status];
}

export function healthStatusShortLabel(status: HealthStatus): string {
  const map: Record<HealthStatus, string> = {
    healthy: "Healthy",
    watch: "Attention",
    at_risk: "At risk",
    critical: "Critical",
  };
  return map[status];
}
