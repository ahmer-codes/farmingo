import type {
  CropHealthItem,
  DashboardAnalytics,
  HealthStatus,
} from "~/types/dashboard";
import type { FarmCrop, YieldAnalytics } from "~/types/crop";
import type { WorkTask } from "~/types/task";

const HEALTH_COLORS: Record<HealthStatus, string> = {
  healthy: "#16a34a",
  watch: "#d97706",
  at_risk: "#ea580c",
  critical: "#dc2626",
};

const HEALTH_LABELS: Record<HealthStatus, string> = {
  healthy: "Healthy",
  watch: "Needs attention",
  at_risk: "At risk",
  critical: "Critical",
};

function formatYieldValue(n: number, unit: string): string {
  if (unit === "tonnes" || n >= 1000) {
    return n >= 1000 ? `${(n / 1000).toFixed(1)} t` : `${n.toFixed(0)} ${unit}`;
  }
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${unit}`;
}

export function buildDashboardAnalytics(
  crops: FarmCrop[],
  yieldAnalytics: YieldAnalytics,
  cropHealthItems: CropHealthItem[],
  tasks: WorkTask[] = [],
): DashboardAnalytics {
  const summary = yieldAnalytics.summary;
  const unit = summary.yieldUnit;

  const achievementPercent =
    summary.expectedYield > 0
      ? Number(((summary.actualYield / summary.expectedYield) * 100).toFixed(1))
      : 0;

  const healthCounts = new Map<HealthStatus, number>();
  for (const c of cropHealthItems) {
    healthCounts.set(c.status, (healthCounts.get(c.status) || 0) + 1);
  }
  const healthDistribution = (
    ["healthy", "watch", "at_risk", "critical"] as HealthStatus[]
  )
    .map((status) => ({
      label: HEALTH_LABELS[status],
      value: healthCounts.get(status) || 0,
      color: HEALTH_COLORS[status],
    }))
    .filter((d) => d.value > 0);

  const totalArea = crops.reduce((s, c) => s + c.areaHa, 0);
  const cropDistribution = crops.map((c) => ({
    label: c.name,
    value:
      totalArea > 0 ? Number(((c.areaHa / totalArea) * 100).toFixed(1)) : 0,
    areaHa: c.areaHa,
  }));

  const healthByCrop = cropHealthItems
    .map((c) => ({ label: c.cropName, score: c.healthScore }))
    .sort((a, b) => b.score - a.score);

  const yieldByCrop = yieldAnalytics.charts.byCrop.map((r) => ({
    label: r.label,
    expected: r.expected,
    actual: r.actual,
    achievementPercent:
      r.expected > 0 ? Number(((r.actual / r.expected) * 100).toFixed(1)) : 0,
  }));

  const yieldByField = yieldAnalytics.charts.byField.map((r) => ({
    label: r.label,
    expected: r.expected,
    actual: r.actual,
  }));

  const yieldTrend = yieldAnalytics.charts.overTime;
  const hasTrend = yieldTrend.length >= 2;

  const taskStatusCounts = new Map<string, number>();
  for (const t of tasks) {
    taskStatusCounts.set(t.status, (taskStatusCounts.get(t.status) || 0) + 1);
  }
  const tasksByStatus = [
    "pending",
    "in_progress",
    "completed",
    "overdue",
    "skipped",
  ]
    .map((status) => ({
      label: status.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      value: taskStatusCounts.get(status) || 0,
    }))
    .filter((d) => d.value > 0);

  return {
    yieldSummary: {
      expected: summary.expectedYield,
      actual: summary.actualYield,
      difference: summary.yieldDifference,
      achievementPercent,
      unit,
      formattedExpected: formatYieldValue(summary.expectedYield, unit),
      formattedActual: formatYieldValue(summary.actualYield, unit),
    },
    yieldByCrop,
    yieldByField,
    yieldTrend,
    hasYieldTrend: hasTrend,
    healthDistribution,
    cropDistribution,
    healthByCrop,
    tasksByStatus,
    averageHealthScore:
      cropHealthItems.length > 0
        ? Math.round(
            cropHealthItems.reduce((s, c) => s + c.healthScore, 0) /
              cropHealthItems.length,
          )
        : 0,
  };
}
