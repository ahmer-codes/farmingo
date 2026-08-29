import type { Query } from "firebase-admin/firestore";
import { db } from "../../config/firebase-admin";
import {
  cropRepository,
  diseaseAssessmentRepository,
  farmRepository,
  fieldRepository,
  taskRepository,
  userRepository,
  yieldRepository,
} from "../../repositories";
import { supportConversationRepository } from "../../repositories/firestore/supportConversation.repository";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";
import type { UserRecord } from "../../models/user";
import type { AccountType, UserStatus } from "../../models/user";
import type { FarmRecord } from "../../models/user";
import type { CropRecord } from "../../models/crop";
import type { FieldRecord } from "../../models/crop";
import type { DiseaseAssessmentRecord } from "../../models/diseaseAssessment";
import type { TaskRecord, TreatmentPlanRecord } from "../../models/task";
import type { YieldRecord } from "../../models/crop";
import { ApiError } from "../../utils/ApiError";
import { toFarmProfile } from "../auth.service";
import { userActivityService } from "../userActivity.service";
import {
  toAdminUserActivity,
  toAdminUserListItem,
  type AdminUserSummaries,
  type AdminUserStatusEvent,
} from "./adminUser.dto";

export type AdminUserActivityFilter =
  | "active_today"
  | "active_week"
  | "inactive_7d"
  | "never_active";

async function collectionCount(name: string): Promise<number> {
  const qs = await db.collection(name).count().get();
  return qs.data().count;
}

async function countCompletedTasks(): Promise<number> {
  const qs = await db
    .collection(COLLECTIONS.tasks)
    .where("status", "==", "completed")
    .count()
    .get();
  return qs.data().count;
}

async function countOpenTasks(): Promise<number> {
  const qs = await db
    .collection(COLLECTIONS.tasks)
    .where("status", "in", ["pending", "in_progress", "overdue"])
    .count()
    .get();
  return qs.data().count;
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

async function countUsersWhere(
  field: string,
  op: "==" | ">=" | "<=" | ">" | "<",
  value: string,
) {
  const qs = await db
    .collection(COLLECTIONS.users)
    .where(field, op, value)
    .count()
    .get();
  return qs.data().count;
}

type UserResourceCounts = { farms: number; crops: number; tasks: number };

async function batchCountUserResources(
  userIds: string[],
): Promise<Map<string, UserResourceCounts>> {
  const counts = new Map<string, UserResourceCounts>();
  for (const id of userIds) {
    counts.set(id, { farms: 0, crops: 0, tasks: 0 });
  }
  if (!userIds.length) return counts;

  for (let i = 0; i < userIds.length; i += 30) {
    const chunk = userIds.slice(i, i + 30);
    const [farmsQs, cropsQs, tasksQs] = await Promise.all([
      db.collection(COLLECTIONS.farms).where("ownerId", "in", chunk).get(),
      db.collection(COLLECTIONS.crops).where("userId", "in", chunk).get(),
      db.collection(COLLECTIONS.tasks).where("userId", "in", chunk).get(),
    ]);

    for (const doc of farmsQs.docs) {
      const ownerId = doc.data().ownerId as string;
      const entry = counts.get(ownerId);
      if (entry) entry.farms += 1;
    }
    for (const doc of cropsQs.docs) {
      const uid = doc.data().userId as string;
      const entry = counts.get(uid);
      if (entry) entry.crops += 1;
    }
    for (const doc of tasksQs.docs) {
      const uid = doc.data().userId as string;
      const entry = counts.get(uid);
      if (entry) entry.tasks += 1;
    }
  }

  return counts;
}

function matchesActivityFilter(
  user: UserRecord,
  activity?: AdminUserActivityFilter,
): boolean {
  if (!activity) return true;
  const lastActive = user.lastActiveAt;
  if (activity === "never_active") {
    return !lastActive;
  }
  if (!lastActive) return false;
  const ts = new Date(lastActive).getTime();
  if (Number.isNaN(ts)) return false;

  const todayStart = new Date(startOfTodayIso()).getTime();
  const weekAgo = new Date(daysAgoIso(7)).getTime();

  if (activity === "active_today") return ts >= todayStart;
  if (activity === "active_week") return ts >= weekAgo;
  if (activity === "inactive_7d") return ts < weekAgo;
  return true;
}

function userMatchesListFilters(
  user: UserRecord,
  options: {
    status?: UserStatus;
    accountType?: AccountType;
    activity?: AdminUserActivityFilter;
    joinedSince?: string;
  },
): boolean {
  if (options.status === "disabled" && user.status !== "disabled") return false;
  if (options.status === "active" && user.status === "disabled") return false;
  if (options.accountType && user.accountType !== options.accountType)
    return false;
  if (options.joinedSince && user.createdAt < options.joinedSince) return false;
  if (!matchesActivityFilter(user, options.activity)) return false;
  return true;
}

async function fetchUserStatusHistory(
  uid: string,
): Promise<AdminUserStatusEvent[]> {
  const qs = await db
    .collection(COLLECTIONS.adminAuditLogs)
    .where("targetUserId", "==", uid)
    .limit(100)
    .get();

  return qs.docs
    .map((doc) => doc.data())
    .filter(
      (
        row,
      ): row is {
        action: "user_disable" | "user_enable";
        adminId: string;
        createdAt: string;
      } => row.action === "user_disable" || row.action === "user_enable",
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 40)
    .map((row) => ({
      action: row.action,
      adminId: row.adminId,
      createdAt: row.createdAt,
    }));
}

async function enrichUsersList(users: UserRecord[]) {
  if (!users.length) return [];
  const countsMap = await batchCountUserResources(users.map((user) => user.id));
  return users.map((user) =>
    toAdminUserListItem(
      user,
      countsMap.get(user.id) || { farms: 0, crops: 0, tasks: 0 },
    ),
  );
}

function buildUserSummaries(input: {
  tasks: TaskRecord[];
  yields: YieldRecord[];
  diseaseAssessments: DiseaseAssessmentRecord[];
  treatmentPlans: TreatmentPlanRecord[];
  fields: FieldRecord[];
  crops: CropRecord[];
}): AdminUserSummaries {
  const openTasks = input.tasks.filter((t) =>
    ["pending", "in_progress", "overdue"].includes(t.status),
  ).length;
  const completedTasks = input.tasks.filter(
    (t) => t.status === "completed",
  ).length;

  return {
    tasks: {
      total: input.tasks.length,
      open: openTasks,
      completed: completedTasks,
    },
    yields: {
      total: input.yields.length,
      expectedTotal: Number(
        input.yields
          .reduce((sum, y) => sum + (y.expectedYield || 0), 0)
          .toFixed(2),
      ),
      actualTotal: Number(
        input.yields
          .reduce((sum, y) => sum + (y.actualYield || 0), 0)
          .toFixed(2),
      ),
    },
    diseaseAssessments: { total: input.diseaseAssessments.length },
    treatmentPlans: { total: input.treatmentPlans.length },
    fields: { total: input.fields.length },
    crops: { total: input.crops.length },
  };
}

import { adminDashboardService as adminDashboardAnalytics } from "./adminDashboard.service";

export const adminDashboardService = {
  parseRange: adminDashboardAnalytics.parseRange,

  async getDashboard(range?: string) {
    return adminDashboardAnalytics.getDashboard(range);
  },

  async getStats() {
    const dashboard = await adminDashboardAnalytics.getDashboard("180d");
    return {
      ...dashboard.kpis,
      totalFields: await collectionCount(COLLECTIONS.fields),
      totalTreatmentPlans: await collectionCount(COLLECTIONS.treatmentPlans),
      completedTasks: await countCompletedTasks(),
      totalYieldRecords: await collectionCount(COLLECTIONS.yieldRecords),
      unreadAdminMessages:
        await supportConversationRepository.countUnreadAdmin(),
      unreadConversations:
        await supportConversationRepository.countUnreadAdmin(),
      openSupportConversations: dashboard.kpis.openSupportConversations,
      inactive7PlusDays: await countUsersWhere(
        "lastActiveAt",
        "<",
        daysAgoIso(7),
      ),
      newUsersThisMonth: await countUsersWhere(
        "createdAt",
        ">=",
        startOfMonthIso(),
      ),
    };
  },

  async getAnalytics() {
    const dashboard = await adminDashboardAnalytics.getDashboard("180d");
    return {
      userGrowth: dashboard.analytics.userGrowth,
      cropDistribution: dashboard.analytics.cropDistribution,
      diseaseByDisease: dashboard.analytics.diseaseByDisease,
      diseaseByCrop: dashboard.analytics.diseaseByCrop,
      taskStatus: dashboard.analytics.taskStatus,
      yieldTrend: dashboard.analytics.yieldTrend,
      farmStatistics: dashboard.analytics.farmSizeDistribution,
      sampleLimits: dashboard.meta.limits,
    };
  },
};

export const adminUsersService = {
  async getStats() {
    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      disabledUsers,
      newUsersThisMonth,
    ] = await Promise.all([
      collectionCount(COLLECTIONS.users),
      countUsersWhere("lastActiveAt", ">=", startOfTodayIso()),
      countUsersWhere("lastActiveAt", ">=", daysAgoIso(7)),
      countUsersWhere("status", "==", "disabled"),
      countUsersWhere("createdAt", ">=", startOfMonthIso()),
    ]);

    return {
      totalUsers,
      activeToday,
      activeThisWeek,
      disabledUsers,
      newUsersThisMonth,
    };
  },

  async listUsers(options: {
    limit?: number;
    cursor?: string;
    search?: string;
    status?: UserStatus;
    accountType?: AccountType;
    activity?: AdminUserActivityFilter;
    joinedSince?: string;
  }) {
    const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
    const search = options.search?.trim().toLowerCase();

    if (search) {
      if (search.includes("@")) {
        const exact = await userRepository.findByEmail(search);
        if (exact && userMatchesListFilters(exact, options)) {
          return {
            items: await enrichUsersList([exact]),
            nextCursor: null,
            hasMore: false,
            searchMode: "exact_email" as const,
          };
        }
        return searchUsersByPrefix(
          "email",
          search,
          limit,
          options.status,
          options.accountType,
          options.activity,
          options.joinedSince,
          options.cursor,
        );
      }
      return searchUsersByPrefix(
        "fullNameLower",
        search,
        limit,
        options.status,
        options.accountType,
        options.activity,
        options.joinedSince,
        options.cursor,
      );
    }

    if (options.activity === "never_active") {
      return listUsersNeverActive(options, limit);
    }

    let query: Query = db.collection(COLLECTIONS.users);

    if (options.joinedSince) {
      query = query
        .where("createdAt", ">=", options.joinedSince)
        .orderBy("createdAt", "desc");
    } else if (options.activity === "active_today") {
      query = query
        .where("lastActiveAt", ">=", startOfTodayIso())
        .orderBy("lastActiveAt", "desc");
    } else if (options.activity === "active_week") {
      query = query
        .where("lastActiveAt", ">=", daysAgoIso(7))
        .orderBy("lastActiveAt", "desc");
    } else if (options.activity === "inactive_7d") {
      query = query
        .where("lastActiveAt", "<", daysAgoIso(7))
        .orderBy("lastActiveAt", "desc");
    } else {
      query = query.orderBy("createdAt", "desc");
    }

    if (options.status === "disabled") {
      query = query.where("status", "==", "disabled");
    } else if (options.status === "active") {
      query = query.where("status", "==", "active");
    }

    if (options.accountType) {
      query = query.where("accountType", "==", options.accountType);
    }

    query = query.limit(limit + 1);

    if (options.cursor) {
      const cursorSnap = await db
        .collection(COLLECTIONS.users)
        .doc(options.cursor)
        .get();
      if (cursorSnap.exists) {
        let cursorQuery: Query = db.collection(COLLECTIONS.users);
        if (options.joinedSince) {
          cursorQuery = cursorQuery
            .where("createdAt", ">=", options.joinedSince)
            .orderBy("createdAt", "desc");
        } else if (options.activity === "active_today") {
          cursorQuery = cursorQuery
            .where("lastActiveAt", ">=", startOfTodayIso())
            .orderBy("lastActiveAt", "desc");
        } else if (options.activity === "active_week") {
          cursorQuery = cursorQuery
            .where("lastActiveAt", ">=", daysAgoIso(7))
            .orderBy("lastActiveAt", "desc");
        } else if (options.activity === "inactive_7d") {
          cursorQuery = cursorQuery
            .where("lastActiveAt", "<", daysAgoIso(7))
            .orderBy("lastActiveAt", "desc");
        } else {
          cursorQuery = cursorQuery.orderBy("createdAt", "desc");
        }
        if (options.status === "disabled") {
          cursorQuery = cursorQuery.where("status", "==", "disabled");
        } else if (options.status === "active") {
          cursorQuery = cursorQuery.where("status", "==", "active");
        }
        if (options.accountType) {
          cursorQuery = cursorQuery.where(
            "accountType",
            "==",
            options.accountType,
          );
        }
        query = cursorQuery.startAfter(cursorSnap).limit(limit + 1);
      }
    }

    const qs = await query.get();
    let users = qs.docs.map((d) => docToRecord<UserRecord>(d));

    if (
      options.activity &&
      options.joinedSince &&
      !["active_today", "active_week", "inactive_7d", "never_active"].includes(
        options.activity,
      )
    ) {
      users = users.filter((user) =>
        matchesActivityFilter(user, options.activity),
      );
    }

    const hasMore = users.length > limit;
    const page = hasMore ? users.slice(0, limit) : users;
    const items = await enrichUsersList(page);

    return {
      items,
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
      hasMore,
      searchMode: null,
    };
  },

  async getUserDetail(uid: string) {
    const user = await userRepository.findById(uid);
    if (!user) throw new ApiError(404, "User not found");

    const [
      farm,
      fields,
      crops,
      tasks,
      yields,
      assessments,
      conversation,
      conversations,
      statusHistoryResult,
    ] = await Promise.all([
      farmRepository.findByOwnerId(uid),
      fieldRepository.listByUser(uid),
      cropRepository.listByUser(uid),
      taskRepository.listByUser(uid),
      yieldRepository.listByUser(uid),
      diseaseAssessmentRepository.listByOwner(uid),
      supportConversationRepository.getCurrentConversation(uid),
      supportConversationRepository.listByUserId(uid, 50),
      fetchUserStatusHistory(uid).catch(() => [] as AdminUserStatusEvent[]),
    ]);
    const statusHistory = statusHistoryResult;

    const DETAIL_SECTION_LIMIT = 100;
    const limitedFields = fields.slice(0, DETAIL_SECTION_LIMIT);
    const limitedCrops = crops.slice(0, DETAIL_SECTION_LIMIT);
    const limitedTasks = tasks.slice(0, DETAIL_SECTION_LIMIT);
    const limitedYields = yields.slice(0, DETAIL_SECTION_LIMIT);
    const limitedAssessments = assessments.slice(0, DETAIL_SECTION_LIMIT);

    const plansSnap = await db
      .collection(COLLECTIONS.treatmentPlans)
      .where("userId", "==", uid)
      .get();
    const treatmentPlans = plansSnap.docs.map((d) =>
      docToRecord<TreatmentPlanRecord>(d),
    );

    const activity = toAdminUserActivity(user);
    const summaries = buildUserSummaries({
      tasks: limitedTasks,
      yields: limitedYields,
      diseaseAssessments: limitedAssessments,
      treatmentPlans,
      fields: limitedFields,
      crops: limitedCrops,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone ?? null,
        avatarUrl: user.avatarUrl ?? null,
        createdAt: user.createdAt,
      },
      activity,
      farm: farm ? toFarmProfile(farm) : null,
      fields: limitedFields,
      crops: limitedCrops,
      tasks: limitedTasks,
      yields: limitedYields,
      diseaseAssessments: limitedAssessments,
      treatmentPlans,
      conversation,
      conversations,
      statusHistory,
      summaries,
    };
  },

  async patchUserStatus(uid: string, status: UserStatus, adminId: string) {
    const updated = await userActivityService.setAccountStatus(uid, status);
    await db.collection(COLLECTIONS.adminAuditLogs).add(
      stripUndefined({
        adminId,
        action: status === "disabled" ? "user_disable" : "user_enable",
        targetUserId: uid,
        createdAt: nowIso(),
      }),
    );
    return toAdminUserActivity(updated);
  },
};

async function searchUsersByPrefix(
  field: "email" | "fullNameLower",
  prefix: string,
  limit: number,
  status?: UserStatus,
  accountType?: AccountType,
  activity?: AdminUserActivityFilter,
  joinedSince?: string,
  cursor?: string,
) {
  const end = prefix + "\uf8ff";
  let query: Query = db
    .collection(COLLECTIONS.users)
    .where(field, ">=", prefix)
    .where(field, "<=", end)
    .orderBy(field)
    .limit(limit + 1);

  if (cursor) {
    const cursorSnap = await db.collection(COLLECTIONS.users).doc(cursor).get();
    if (cursorSnap.exists) {
      query = db
        .collection(COLLECTIONS.users)
        .where(field, ">=", prefix)
        .where(field, "<=", end)
        .orderBy(field)
        .startAfter(cursorSnap)
        .limit(limit + 1);
    }
  }

  const qs = await query.get();
  let users = qs.docs.map((d) => docToRecord<UserRecord>(d));

  if (status) {
    users = users.filter((u) =>
      status === "disabled" ? u.status === "disabled" : u.status !== "disabled",
    );
  }
  if (accountType) {
    users = users.filter((u) => u.accountType === accountType);
  }
  if (joinedSince) {
    users = users.filter((u) => u.createdAt >= joinedSince);
  }
  if (activity) {
    users = users.filter((u) => matchesActivityFilter(u, activity));
  }

  const hasMore = users.length > limit;
  const page = hasMore ? users.slice(0, limit) : users;
  const items = await enrichUsersList(page);

  return {
    items,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
    searchMode: "prefix" as const,
  };
}

async function listUsersNeverActive(
  options: {
    limit?: number;
    cursor?: string;
    status?: UserStatus;
    accountType?: AccountType;
    joinedSince?: string;
  },
  limit: number,
) {
  const matched: UserRecord[] = [];
  let scanCursor = options.cursor;
  let firestoreExhausted = false;
  const batchSize = 100;

  while (matched.length < limit + 1 && !firestoreExhausted) {
    let query: Query = options.joinedSince
      ? db
          .collection(COLLECTIONS.users)
          .where("createdAt", ">=", options.joinedSince)
          .orderBy("createdAt", "desc")
          .limit(batchSize)
      : db
          .collection(COLLECTIONS.users)
          .orderBy("createdAt", "desc")
          .limit(batchSize);

    if (scanCursor) {
      const cursorSnap = await db
        .collection(COLLECTIONS.users)
        .doc(scanCursor)
        .get();
      if (cursorSnap.exists) {
        query = options.joinedSince
          ? db
              .collection(COLLECTIONS.users)
              .where("createdAt", ">=", options.joinedSince!)
              .orderBy("createdAt", "desc")
              .startAfter(cursorSnap)
              .limit(batchSize)
          : db
              .collection(COLLECTIONS.users)
              .orderBy("createdAt", "desc")
              .startAfter(cursorSnap)
              .limit(batchSize);
      }
    }

    const qs = await query.get();
    if (!qs.docs.length) {
      firestoreExhausted = true;
      break;
    }

    for (const doc of qs.docs) {
      const user = docToRecord<UserRecord>(doc);
      if (user.lastActiveAt) continue;
      if (options.status === "disabled" && user.status !== "disabled") continue;
      if (options.status === "active" && user.status === "disabled") continue;
      if (options.accountType && user.accountType !== options.accountType)
        continue;
      if (options.joinedSince && user.createdAt < options.joinedSince) continue;
      matched.push(user);
      if (matched.length > limit) break;
    }

    if (qs.docs.length < batchSize) {
      firestoreExhausted = true;
    } else {
      scanCursor = qs.docs[qs.docs.length - 1]?.id;
    }
  }

  const hasMore = matched.length > limit || !firestoreExhausted;
  const page = matched.slice(0, limit);
  const items = await enrichUsersList(page);

  return {
    items,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
    searchMode: null,
  };
}

export const adminResourcesService = {
  async listFarms(options: { limit?: number; cursor?: string }) {
    return paginateCollection<FarmRecord>(
      COLLECTIONS.farms,
      "createdAt",
      options,
    );
  },

  async listFields(options: { limit?: number; cursor?: string }) {
    return paginateCollection<FieldRecord>(
      COLLECTIONS.fields,
      "createdAt",
      options,
    );
  },

  async listCrops(options: { limit?: number; cursor?: string }) {
    return paginateCollection<CropRecord>(
      COLLECTIONS.crops,
      "createdAt",
      options,
    );
  },

  async listYields(options: { limit?: number; cursor?: string }) {
    return paginateCollection<YieldRecord>(
      COLLECTIONS.yieldRecords,
      "createdAt",
      options,
    );
  },

  async listDiseaseAssessments(options: { limit?: number; cursor?: string }) {
    return paginateCollection<DiseaseAssessmentRecord>(
      COLLECTIONS.diseaseAssessments,
      "createdAt",
      options,
    );
  },

  async listTasks(options: { limit?: number; cursor?: string }) {
    return paginateCollection<TaskRecord>(
      COLLECTIONS.tasks,
      "createdAt",
      options,
    );
  },

  async listTreatmentPlans(options: { limit?: number; cursor?: string }) {
    return paginateCollection<TreatmentPlanRecord>(
      COLLECTIONS.treatmentPlans,
      "createdAt",
      options,
    );
  },
};

async function paginateCollection<T extends { id: string }>(
  collectionName: string,
  orderField: string,
  options: { limit?: number; cursor?: string },
) {
  const limit = Math.min(Math.max(options.limit ?? 25, 1), 100);
  let query = db
    .collection(collectionName)
    .orderBy(orderField, "desc")
    .limit(limit + 1);

  if (options.cursor) {
    const cursorSnap = await db
      .collection(collectionName)
      .doc(options.cursor)
      .get();
    if (cursorSnap.exists) {
      query = db
        .collection(collectionName)
        .orderBy(orderField, "desc")
        .startAfter(cursorSnap)
        .limit(limit + 1);
    }
  }

  const qs = await query.get();
  const items = qs.docs.map((d) => docToRecord<T>(d));
  const hasMore = items.length > limit;
  const page = hasMore ? items.slice(0, limit) : items;
  return {
    items: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
  };
}
