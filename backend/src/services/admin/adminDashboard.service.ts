import { db } from "../../config/firebase-admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { supportConversationRepository } from "../../repositories/firestore/supportConversation.repository";
import { COLLECTIONS, docToRecord } from "../../utils/firestore";
import type { UserRecord } from "../../models/user";
import type { FarmRecord } from "../../models/user";
import type {
  CropRecord,
  CropHealthStatus,
  YieldRecord,
} from "../../models/crop";
import type { DiseaseAssessmentRecord } from "../../models/diseaseAssessment";
import type {
  TaskRecord,
  TaskStatus,
  TreatmentPlanRecord,
} from "../../models/task";
import type { SupportConversationRecord } from "../../models/supportConversation";
import { HEALTH_STATUS_LABELS } from "../../models/crop";

export type DashboardRange = "7d" | "30d" | "90d" | "180d" | "365d";

export interface DashboardQueryMeta {
  range: DashboardRange;
  rangeStart: string;
  rangeEnd: string;
  truncated: boolean;
  limits: Record<string, number>;
}

export interface AdminDashboardKpis {
  totalUsers: number;
  activeToday: number;
  activeLast7Days: number;
  totalFarms: number;
  totalCrops: number;
  openTasks: number;
  diseaseAssessments: number;
  openSupportConversations: number;
}

export interface AdminDashboardAnalytics {
  userGrowth: Array<{ month: string; count: number }>;
  yieldTrend: Array<{
    month: string;
    expected: number;
    actual: number;
    records: number;
  }>;
  cropDistribution: Array<{ label: string; value: number }>;
  cropHealthDistribution: Array<{ label: string; value: number }>;
  taskStatus: Array<{ label: string; value: number }>;
  diseaseOverTime: Array<{ month: string; count: number }>;
  diseaseByDisease: Array<{ label: string; value: number }>;
  diseaseByCrop: Array<{ label: string; value: number }>;
  farmSizeDistribution: Array<{ label: string; value: number }>;
  supportActivity: Array<{
    month: string;
    newConversations: number;
    resolvedConversations: number;
    activeConversations: number;
  }>;
  treatmentPlansOverTime: Array<{ month: string; count: number }>;
  yieldPerformanceByCrop: Array<{
    label: string;
    expected: number;
    actual: number;
    achievementPercent: number | null;
  }>;
}

export interface AdminDashboardResponse {
  kpis: AdminDashboardKpis;
  analytics: AdminDashboardAnalytics;
  meta: DashboardQueryMeta;
}

const RANGE_DAYS: Record<DashboardRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "180d": 180,
  "365d": 365,
};

const QUERY_LIMITS = {
  users: 3000,
  crops: 3000,
  yields: 3000,
  diseases: 3000,
  tasks: 3000,
  farms: 2000,
  conversations: 2000,
  treatmentPlans: 2000,
} as const;

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  completed: "Completed",
  overdue: "Overdue",
  skipped: "Skipped",
};

const CHART_COLORS = [
  "#1a4d2e",
  "#2563eb",
  "#d97706",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
];

let dashboardCache: {
  key: string;
  expiresAt: number;
  payload: AdminDashboardResponse;
} | null = null;
const CACHE_TTL_MS = 60_000;

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function parseRange(raw?: string): DashboardRange {
  if (
    raw === "7d" ||
    raw === "30d" ||
    raw === "90d" ||
    raw === "180d" ||
    raw === "365d"
  ) {
    return raw;
  }
  return "180d";
}

function monthBucketsBetween(startIso: string, endIso: string): string[] {
  const buckets: string[] = [];
  const start = new Date(startIso);
  const end = new Date(endIso);
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cursor <= endMonth) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
    buckets.push(key);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return buckets;
}

function initMonthCounts(buckets: string[]): Map<string, number> {
  return new Map(buckets.map((b) => [b, 0]));
}

function incrementMonth(map: Map<string, number>, iso: string) {
  const key = monthKey(iso);
  if (!map.has(key)) return;
  map.set(key, (map.get(key) || 0) + 1);
}

async function collectionCount(name: string): Promise<number> {
  const qs = await db.collection(name).count().get();
  return qs.data().count;
}

async function countWhere(
  collectionName: string,
  field: string,
  op: "==" | ">=" | "<=" | ">" | "<" | "in",
  value: string | number | boolean | string[],
): Promise<number> {
  const qs = await db
    .collection(collectionName)
    .where(field, op, value)
    .count()
    .get();
  return qs.data().count;
}

async function countTasksByStatus(status: TaskStatus): Promise<number> {
  return countWhere(COLLECTIONS.tasks, "status", "==", status);
}

async function countCropsByHealth(status: CropHealthStatus): Promise<number> {
  return countWhere(COLLECTIONS.crops, "healthStatus", "==", status);
}

async function fetchInRange<T extends { id: string; createdAt: string }>(
  collectionName: string,
  rangeStart: string,
  pageSize: number,
  maxPages = 20,
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let truncated = false;
  let lastDoc: QueryDocumentSnapshot | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    let query = db
      .collection(collectionName)
      .where("createdAt", ">=", rangeStart)
      .orderBy("createdAt", "asc")
      .limit(pageSize + 1);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const qs = await query.get();
    const docs = qs.docs.map((d) => docToRecord<T>(d));
    const pageTruncated = docs.length > pageSize;
    const pageItems = pageTruncated ? docs.slice(0, pageSize) : docs;
    items.push(...pageItems);

    if (pageTruncated && page === maxPages - 1) {
      truncated = true;
      break;
    }
    if (!pageTruncated) break;

    lastDoc = qs.docs[pageSize - 1];
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return { items, truncated };
}

async function fetchAllDocs<T extends { id: string }>(
  collectionName: string,
  pageSize: number,
  maxPages = 20,
): Promise<{ items: T[]; truncated: boolean }> {
  const items: T[] = [];
  let truncated = false;
  let lastDoc: QueryDocumentSnapshot | undefined;

  for (let page = 0; page < maxPages; page += 1) {
    let query = db
      .collection(collectionName)
      .orderBy("createdAt", "asc")
      .limit(pageSize + 1);
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const qs = await query.get();
    const docs = qs.docs.map((d) => docToRecord<T>(d));
    const pageTruncated = docs.length > pageSize;
    const pageItems = pageTruncated ? docs.slice(0, pageSize) : docs;
    items.push(...pageItems);

    if (pageTruncated && page === maxPages - 1) {
      truncated = true;
      break;
    }
    if (!pageTruncated) break;

    lastDoc = qs.docs[pageSize - 1];
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return { items, truncated };
}

function topEntries(map: Map<string, number>, max = 10) {
  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([label, value]) => ({ label, value }));
}

function farmSizeBucket(size: number): string {
  if (size <= 5) return "0–5";
  if (size <= 20) return "6–20";
  if (size <= 50) return "21–50";
  return "50+";
}

export const adminDashboardService = {
  parseRange,

  async getDashboard(rangeInput?: string): Promise<AdminDashboardResponse> {
    const range = parseRange(rangeInput);
    const cacheKey = `dashboard:${range}`;
    const now = Date.now();
    if (
      dashboardCache &&
      dashboardCache.key === cacheKey &&
      dashboardCache.expiresAt > now
    ) {
      return dashboardCache.payload;
    }

    const rangeDays = RANGE_DAYS[range];
    const rangeStart = daysAgoIso(rangeDays);
    const rangeEnd = new Date().toISOString();
    const monthBuckets = monthBucketsBetween(rangeStart, rangeEnd);

    const [
      totalUsers,
      activeToday,
      activeLast7Days,
      totalFarms,
      totalCrops,
      openTasks,
      diseaseAssessments,
      openSupportConversations,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      skippedTasks,
      healthyCrops,
      watchCrops,
      atRiskCrops,
      criticalCrops,
      usersInRange,
      cropsInRange,
      yieldsInRange,
      diseasesInRange,
      tasksInRange,
      farmsInRange,
      conversationsInRange,
      treatmentPlansInRange,
      resolvedInRange,
    ] = await Promise.all([
      collectionCount(COLLECTIONS.users),
      countWhere(COLLECTIONS.users, "lastActiveAt", ">=", startOfTodayIso()),
      countWhere(COLLECTIONS.users, "lastActiveAt", ">=", daysAgoIso(7)),
      collectionCount(COLLECTIONS.farms),
      collectionCount(COLLECTIONS.crops),
      countWhere(COLLECTIONS.tasks, "status", "in", [
        "pending",
        "in_progress",
        "overdue",
      ]),
      collectionCount(COLLECTIONS.diseaseAssessments),
      supportConversationRepository.countOpen(),
      countTasksByStatus("pending"),
      countTasksByStatus("in_progress"),
      countTasksByStatus("completed"),
      countTasksByStatus("overdue"),
      countTasksByStatus("skipped"),
      countCropsByHealth("healthy"),
      countCropsByHealth("watch"),
      countCropsByHealth("at_risk"),
      countCropsByHealth("critical"),
      fetchInRange<UserRecord>(
        COLLECTIONS.users,
        rangeStart,
        QUERY_LIMITS.users,
      ),
      fetchInRange<CropRecord>(
        COLLECTIONS.crops,
        rangeStart,
        QUERY_LIMITS.crops,
      ),
      fetchInRange<YieldRecord>(
        COLLECTIONS.yieldRecords,
        rangeStart,
        QUERY_LIMITS.yields,
      ),
      fetchInRange<DiseaseAssessmentRecord>(
        COLLECTIONS.diseaseAssessments,
        rangeStart,
        QUERY_LIMITS.diseases,
      ),
      fetchInRange<TaskRecord>(
        COLLECTIONS.tasks,
        rangeStart,
        QUERY_LIMITS.tasks,
      ),
      fetchInRange<FarmRecord>(
        COLLECTIONS.farms,
        rangeStart,
        QUERY_LIMITS.farms,
      ),
      fetchInRange<SupportConversationRecord>(
        COLLECTIONS.supportConversations,
        rangeStart,
        QUERY_LIMITS.conversations,
      ),
      fetchInRange<TreatmentPlanRecord>(
        COLLECTIONS.treatmentPlans,
        rangeStart,
        QUERY_LIMITS.treatmentPlans,
      ),
      db
        .collection(COLLECTIONS.supportConversations)
        .where("archivedAt", ">=", rangeStart)
        .orderBy("archivedAt", "asc")
        .limit(QUERY_LIMITS.conversations + 1)
        .get(),
    ]);

    const truncated =
      usersInRange.truncated ||
      cropsInRange.truncated ||
      yieldsInRange.truncated ||
      diseasesInRange.truncated ||
      tasksInRange.truncated ||
      farmsInRange.truncated ||
      conversationsInRange.truncated ||
      treatmentPlansInRange.truncated ||
      resolvedInRange.docs.length > QUERY_LIMITS.conversations;

    const allCropsResult = await fetchAllDocs<CropRecord>(
      COLLECTIONS.crops,
      QUERY_LIMITS.crops,
    );
    const allCrops = allCropsResult.items;
    const allCropsTruncated = allCropsResult.truncated;
    const cropDistributionMap = new Map<string, number>();
    for (const crop of allCrops) {
      const name = crop.name.trim() || "Unknown";
      cropDistributionMap.set(name, (cropDistributionMap.get(name) || 0) + 1);
    }

    const allFarmsResult = await fetchAllDocs<FarmRecord>(
      COLLECTIONS.farms,
      QUERY_LIMITS.farms,
    );
    const allFarms = allFarmsResult.items;
    const allFarmsTruncated = allFarmsResult.truncated;
    const farmSizeMap = new Map<string, number>();
    for (const farm of allFarms) {
      const bucket = farmSizeBucket(farm.size);
      farmSizeMap.set(bucket, (farmSizeMap.get(bucket) || 0) + 1);
    }

    const userGrowthMap = initMonthCounts(monthBuckets);
    for (const user of usersInRange.items) {
      incrementMonth(userGrowthMap, user.createdAt);
    }

    const yieldTrendMap = new Map<
      string,
      { expected: number; actual: number; count: number }
    >();
    for (const bucket of monthBuckets) {
      yieldTrendMap.set(bucket, { expected: 0, actual: 0, count: 0 });
    }
    for (const record of yieldsInRange.items) {
      const key = monthKey(record.createdAt);
      const entry = yieldTrendMap.get(key);
      if (!entry) continue;
      entry.expected += record.expectedYield || 0;
      entry.actual += record.actualYield || 0;
      entry.count += 1;
    }

    const diseaseOverTimeMap = initMonthCounts(monthBuckets);
    const diseaseByNameMap = new Map<string, number>();
    const diseaseByCropMap = new Map<string, number>();
    for (const assessment of diseasesInRange.items) {
      incrementMonth(diseaseOverTimeMap, assessment.createdAt);
      const disease = assessment.possibleDisease?.trim() || "Unknown";
      diseaseByNameMap.set(disease, (diseaseByNameMap.get(disease) || 0) + 1);
      const cropName = assessment.cropName?.trim() || "Unknown";
      diseaseByCropMap.set(cropName, (diseaseByCropMap.get(cropName) || 0) + 1);
    }

    const taskStatus = [
      { label: TASK_STATUS_LABELS.pending, value: pendingTasks },
      { label: TASK_STATUS_LABELS.in_progress, value: inProgressTasks },
      { label: TASK_STATUS_LABELS.completed, value: completedTasks },
      { label: TASK_STATUS_LABELS.overdue, value: overdueTasks },
      { label: TASK_STATUS_LABELS.skipped, value: skippedTasks },
    ].filter((row) => row.value > 0);

    const supportNewMap = initMonthCounts(monthBuckets);
    const supportResolvedMap = initMonthCounts(monthBuckets);
    const supportActiveMap = initMonthCounts(monthBuckets);

    for (const conversation of conversationsInRange.items) {
      incrementMonth(supportNewMap, conversation.createdAt);
      if (conversation.lastMessageAt) {
        incrementMonth(supportActiveMap, conversation.lastMessageAt);
      }
    }

    const resolvedDocs = resolvedInRange.docs.slice(
      0,
      QUERY_LIMITS.conversations,
    );
    for (const doc of resolvedDocs) {
      const conversation = docToRecord<SupportConversationRecord>(doc);
      const resolvedAt = conversation.archivedAt || conversation.closedAt;
      if (resolvedAt) {
        incrementMonth(supportResolvedMap, resolvedAt);
      }
    }

    const treatmentPlansMap = initMonthCounts(monthBuckets);
    for (const plan of treatmentPlansInRange.items) {
      incrementMonth(treatmentPlansMap, plan.createdAt);
    }

    const yieldByCropMap = new Map<
      string,
      { expected: number; actual: number }
    >();
    for (const record of yieldsInRange.items) {
      const label = record.cropName?.trim() || "Unknown";
      const entry = yieldByCropMap.get(label) || { expected: 0, actual: 0 };
      entry.expected += record.expectedYield || 0;
      entry.actual += record.actualYield || 0;
      yieldByCropMap.set(label, entry);
    }

    const payload: AdminDashboardResponse = {
      kpis: {
        totalUsers,
        activeToday,
        activeLast7Days,
        totalFarms,
        totalCrops,
        openTasks,
        diseaseAssessments,
        openSupportConversations,
      },
      analytics: {
        userGrowth: monthBuckets.map((month) => ({
          month,
          count: userGrowthMap.get(month) || 0,
        })),
        yieldTrend: monthBuckets
          .map((month) => {
            const entry = yieldTrendMap.get(month) || {
              expected: 0,
              actual: 0,
              count: 0,
            };
            return {
              month,
              expected: Number(entry.expected.toFixed(2)),
              actual: Number(entry.actual.toFixed(2)),
              records: entry.count,
            };
          })
          .filter((row) => row.records > 0),
        cropDistribution: topEntries(cropDistributionMap, 12),
        cropHealthDistribution: (
          [
            ["healthy", healthyCrops],
            ["watch", watchCrops],
            ["at_risk", atRiskCrops],
            ["critical", criticalCrops],
          ] as const
        )
          .filter(([, value]) => value > 0)
          .map(([status, value]) => ({
            label: HEALTH_STATUS_LABELS[status],
            value,
          })),
        taskStatus,
        diseaseOverTime: monthBuckets.map((month) => ({
          month,
          count: diseaseOverTimeMap.get(month) || 0,
        })),
        diseaseByDisease: topEntries(diseaseByNameMap, 10),
        diseaseByCrop: topEntries(diseaseByCropMap, 10),
        farmSizeDistribution: ["0–5", "6–20", "21–50", "50+"]
          .map((label) => ({ label, value: farmSizeMap.get(label) || 0 }))
          .filter((row) => row.value > 0),
        supportActivity: monthBuckets.map((month) => ({
          month,
          newConversations: supportNewMap.get(month) || 0,
          resolvedConversations: supportResolvedMap.get(month) || 0,
          activeConversations: supportActiveMap.get(month) || 0,
        })),
        treatmentPlansOverTime: monthBuckets.map((month) => ({
          month,
          count: treatmentPlansMap.get(month) || 0,
        })),
        yieldPerformanceByCrop: Array.from(yieldByCropMap.entries())
          .map(([label, totals]) => ({
            label,
            expected: Number(totals.expected.toFixed(2)),
            actual: Number(totals.actual.toFixed(2)),
            achievementPercent:
              totals.expected > 0
                ? Number(((totals.actual / totals.expected) * 100).toFixed(1))
                : null,
          }))
          .sort(
            (a, b) => (b.achievementPercent ?? 0) - (a.achievementPercent ?? 0),
          )
          .slice(0, 10),
      },
      meta: {
        range,
        rangeStart,
        rangeEnd,
        truncated: truncated || allCropsTruncated || allFarmsTruncated,
        limits: { ...QUERY_LIMITS },
      },
    };

    dashboardCache = { key: cacheKey, expiresAt: now + CACHE_TTL_MS, payload };
    return payload;
  },
};

export { CHART_COLORS as ADMIN_CHART_COLORS };
