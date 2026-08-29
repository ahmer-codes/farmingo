import type {
  ActivityItem,
  CropHealthItem,
  DashboardAnalytics,
  DashboardOverview,
  FarmAlert,
  YieldSeries,
} from "~/types/dashboard";
import type { FarmCrop } from "~/types/crop";
import type { AppNotification } from "~/types/notification";
import type { WorkTask } from "~/types/task";
import { growthStageLabel } from "~/types/crop";
import { resolveAuthToken } from "./authToken";
import { cropService, fieldService, yieldService } from "./crop.service";
import { taskService } from "./task.service";
import { notificationService } from "./notification.service";
import { farmService } from "./farm.service";
import { buildDashboardAnalytics } from "~/utils/dashboardAnalytics";
import {
  buildTaskSummary,
  countCompletedTasks,
  countOpenTasks,
  todayIsoDate,
} from "~/utils/taskGrouping";

function formatDisplayDate(iso: string): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function mapCrop(crop: FarmCrop): CropHealthItem {
  return {
    id: crop.id,
    cropName: crop.name,
    fieldName: crop.fieldName,
    variety: crop.variety || "-",
    areaHa: crop.areaHa,
    status: crop.healthStatus,
    healthScore: crop.healthScore,
    stage: growthStageLabel(crop.growthStage),
    plantingDate: formatDisplayDate(crop.plantingDate),
    estimatedHarvestDate: formatDisplayDate(crop.expectedHarvestDate),
    lastUpdated: formatDisplayDate(crop.updatedAt.slice(0, 10)),
  };
}

function notificationSource(
  type: AppNotification["type"],
): FarmAlert["source"] {
  if (type === "weather_alert") return "weather";
  if (type === "disease_alert") return "crop";
  if (
    type === "task_reminder" ||
    type === "overdue_task" ||
    type === "treatment_followup"
  ) {
    return "task";
  }
  return "system";
}

function mapAlerts(items: AppNotification[]): FarmAlert[] {
  return items.slice(0, 8).map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    severity:
      n.severity === "critical" ||
      n.severity === "warning" ||
      n.severity === "info"
        ? n.severity
        : "info",
    source: notificationSource(n.type),
    createdAt: n.createdAt,
  }));
}

function mapActivity(
  notifications: AppNotification[],
  tasks: WorkTask[],
  crops: FarmCrop[],
): ActivityItem[] {
  const items: ActivityItem[] = [];

  for (const n of notifications.slice(0, 5)) {
    let type: ActivityItem["type"] = "profile_updated";
    if (n.type === "weather_alert") type = "weather_alert";
    else if (n.type === "disease_alert") type = "disease_assessment";
    else if (n.type === "yield_reminder") type = "yield_logged";
    else if (n.type.includes("task") || n.type === "treatment_followup")
      type = "task_completed";
    items.push({
      id: `n-${n.id}`,
      type,
      title: n.title,
      detail: n.message,
      createdAt: n.createdAt,
    });
  }

  for (const t of tasks.filter((x) => x.status === "completed").slice(0, 3)) {
    items.push({
      id: `t-${t.id}`,
      type: "task_completed",
      title: `Completed: ${t.title}`,
      detail: `${t.crop} · ${t.field}`,
      createdAt: t.completedAt || t.updatedAt,
    });
  }

  for (const c of crops.slice(0, 2)) {
    items.push({
      id: `c-${c.id}`,
      type: "crop_added",
      title: `${c.name} on ${c.fieldName}`,
      detail: `${growthStageLabel(c.growthStage)} · ${c.season} ${c.year}`,
      createdAt: c.updatedAt,
    });
  }

  return items
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 8);
}

function mapYieldSeries(
  analytics: Awaited<ReturnType<typeof yieldService.analytics>>,
): YieldSeries[] {
  const byCrop = new Map<
    string,
    { expectedKg: number; actualKg: number; season: string; year: number }[]
  >();
  for (const row of analytics.records) {
    const list = byCrop.get(row.cropName) || [];
    list.push({
      expectedKg: row.expectedYield,
      actualKg: row.actualYield,
      season: row.season,
      year: row.year,
    });
    byCrop.set(row.cropName, list);
  }

  return Array.from(byCrop.entries()).map(([crop, points]) => {
    const latest = points[points.length - 1];
    const cropRecords = analytics.records.filter((r) => r.cropName === crop);
    return {
      crop,
      season: latest?.season || "",
      year: latest?.year || new Date().getFullYear(),
      points: points.map((p, i) => ({
        label: cropRecords[i]?.periodLabel || `${crop} ${i + 1}`,
        expectedKg: p.expectedKg,
        actualKg: p.actualKg,
      })),
    };
  });
}

/**
 * Aggregates live farm domain APIs into the dashboard overview contract.
 * No mock farm data, weather, crops, tasks, notifications, and yield all come from the backend.
 */
export const dashboardService = {
  async getOverview(
    farmProfile?: { location?: string; region?: string } | null,
  ): Promise<
    Omit<
      DashboardOverview,
      "weather" | "weatherError" | "weatherStatus" | "recommendedActions"
    >
  > {
    const token = await resolveAuthToken();
    if (!token) {
      throw new Error("Sign in to view your dashboard.");
    }

    const today = todayIsoDate();

    const [
      farmOverview,
      fields,
      crops,
      taskList,
      notifications,
      yieldAnalytics,
    ] = await Promise.all([
      farmService.getOverview(token).catch(() => null),
      fieldService.list(token),
      cropService.list(token),
      taskService.list(token, "all"),
      notificationService.list(token),
      yieldService.analytics(token),
    ]);

    const expectedYieldTotal = crops.reduce((s, c) => s + c.expectedYield, 0);
    const actualYieldTotal = crops.reduce(
      (s, c) => s + (c.actualYield ?? 0),
      0,
    );
    const yieldUnit = crops[0]?.yieldUnit || yieldAnalytics.summary.yieldUnit;
    const achievementPercent =
      expectedYieldTotal > 0
        ? Number(((actualYieldTotal / expectedYieldTotal) * 100).toFixed(1))
        : 0;
    const pendingOpen = countOpenTasks(taskList.tasks, today);
    const completed = countCompletedTasks(taskList.tasks);
    const taskSummary = buildTaskSummary(taskList.tasks, today);

    const farmName = farmOverview?.farmName || "Your farm";
    const totalAreaHa =
      fields.reduce((s, f) => s + f.areaHa, 0) ||
      farmOverview?.totalAreaHa ||
      0;

    const location = farmProfile?.location || "";
    const region = farmProfile?.region || "";

    return {
      farm: {
        farmName,
        location,
        region,
        totalAreaHa: Number(totalAreaHa.toFixed(2)),
        activeFields: fields.length,
        landUnitLabel: "ha",
      },
      overview: {
        totalArea: {
          value: String(Number(totalAreaHa.toFixed(1))),
          unit: "ha",
          helper: `${fields.length} field${fields.length === 1 ? "" : "s"} under management`,
        },
        activeCrops: {
          value: String(crops.length),
          helper:
            crops
              .map((c) => c.name)
              .slice(0, 4)
              .join(", ") || "No crops yet",
        },
        estimatedYield: {
          value:
            expectedYieldTotal >= 1000
              ? (expectedYieldTotal / 1000).toFixed(1)
              : String(expectedYieldTotal),
          unit: expectedYieldTotal >= 1000 ? "t" : yieldUnit,
          helper: "Sum of crop expected yields",
        },
        actualYield: {
          value:
            actualYieldTotal >= 1000
              ? (actualYieldTotal / 1000).toFixed(1)
              : String(actualYieldTotal),
          unit: actualYieldTotal >= 1000 ? "t" : yieldUnit,
          helper: crops.some((c) => c.actualYield != null)
            ? "Sum of recorded actual yields"
            : "Record actual yields on crops",
        },
        yieldAchievement: {
          value: `${achievementPercent}%`,
          helper:
            expectedYieldTotal > 0
              ? `${actualYieldTotal >= expectedYieldTotal ? "On or above" : "Below"} seasonal plan`
              : "Set expected yields on crops",
        },
        completedTasks: {
          value: String(completed),
          helper:
            taskSummary.totalThisWeek > 0
              ? `${taskSummary.completedThisWeek}/${taskSummary.totalThisWeek} due this week`
              : "All time in your task list",
        },
        pendingTasks: {
          value: String(pendingOpen),
          helper: `${taskList.summary.overdue} overdue · ${taskList.summary.today} due today`,
        },
      },
      crops: crops.map(mapCrop),
      alerts: mapAlerts(notifications.items),
      tasks: taskSummary,
      yieldSeries: mapYieldSeries(yieldAnalytics),
      analytics: buildDashboardAnalytics(
        crops,
        yieldAnalytics,
        crops.map(mapCrop),
        taskList.tasks,
      ),
      recentActivity: mapActivity(notifications.items, taskList.tasks, crops),
      unreadNotifications: notifications.unreadCount,
    };
  },
};
