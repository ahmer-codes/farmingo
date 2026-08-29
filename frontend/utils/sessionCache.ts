import type { DashboardOverview } from "~/types/dashboard";

export const DASHBOARD_CACHE_PREFIX = "farmingo-dashboard-overview";
const LEGACY_DASHBOARD_CACHE_KEY = "farmingo-dashboard-overview";

/** How long cached dashboard data may be shown before a background refresh. */
export const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedDashboardEnvelope {
  data: DashboardOverview;
  cachedAt: number;
  userId: string;
}

export function dashboardCacheKey(userId: string): string {
  return `${DASHBOARD_CACHE_PREFIX}:${userId}`;
}

export function readDashboardCache(userId: string): DashboardOverview | null {
  if (!import.meta.client || !userId) return null;
  try {
    const raw = sessionStorage.getItem(dashboardCacheKey(userId));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CachedDashboardEnvelope;
    if (envelope.userId !== userId) return null;
    return envelope.data;
  } catch {
    return null;
  }
}

export function readDashboardCacheMeta(
  userId: string,
): { data: DashboardOverview; cachedAt: number } | null {
  if (!import.meta.client || !userId) return null;
  try {
    const raw = sessionStorage.getItem(dashboardCacheKey(userId));
    if (!raw) return null;
    const envelope = JSON.parse(raw) as CachedDashboardEnvelope;
    if (envelope.userId !== userId) return null;
    return { data: envelope.data, cachedAt: envelope.cachedAt };
  } catch {
    return null;
  }
}

export function isDashboardCacheFresh(cachedAt: number): boolean {
  return Date.now() - cachedAt < DASHBOARD_CACHE_TTL_MS;
}

export function writeDashboardCache(userId: string, data: DashboardOverview) {
  if (!import.meta.client || !userId) return;
  try {
    const envelope: CachedDashboardEnvelope = {
      data,
      cachedAt: Date.now(),
      userId,
    };
    sessionStorage.setItem(dashboardCacheKey(userId), JSON.stringify(envelope));
  } catch {
    // Cache is optional.
  }
}

export function clearUserSessionCaches(userId?: string | null) {
  if (!import.meta.client) return;
  sessionStorage.removeItem(LEGACY_DASHBOARD_CACHE_KEY);
  if (userId) {
    sessionStorage.removeItem(dashboardCacheKey(userId));
  }
}

export function invalidateDashboardCache(userId?: string | null) {
  clearUserSessionCaches(userId);
}
