const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function parseIso(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pluralize(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? "" : "s"}`;
}

/** Relative time in the past, e.g. "12 minutes ago", "yesterday". */
export function formatRelativePast(value: string | null | undefined): string {
  const date = parseIso(value);
  if (!date) return "Unknown";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < MINUTE_MS) return "Just now";

  const minutes = Math.floor(diffMs / MINUTE_MS);
  if (minutes < 60) return `${pluralize(minutes, "minute")} ago`;

  const hours = Math.floor(diffMs / HOUR_MS);
  if (hours < 24) return `${pluralize(hours, "hour")} ago`;

  const days = Math.floor(diffMs / DAY_MS);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${pluralize(days, "day")} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${pluralize(weeks, "week")} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${pluralize(months, "month")} ago`;

  const years = Math.floor(days / 365);
  return `${pluralize(years, "year")} ago`;
}

export function formatAdminDateTime(value: string | null | undefined): string {
  const date = parseIso(value);
  if (!date) return "Unknown";
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatAdminDate(value: string | null | undefined): string {
  const date = parseIso(value);
  if (!date) return "Unknown";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** e.g. "Active 12 minutes ago", never claims activity without lastActiveAt. */
export function formatLastActiveLabel(
  lastActiveAt: string | null | undefined,
): string {
  if (!lastActiveAt) return "No activity recorded";
  const relative = formatRelativePast(lastActiveAt);
  if (relative === "Unknown") return "No activity recorded";
  if (relative === "Just now") return "Active just now";
  return `Active ${relative}`;
}

/** e.g. "Last login yesterday", "Never logged in". */
export function formatLastLoginLabel(
  lastLoginAt: string | null | undefined,
): string {
  if (!lastLoginAt) return "Never logged in";
  const date = parseIso(lastLoginAt);
  if (!date) return "Never logged in";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < DAY_MS) return "Logged in today";

  const days = Math.floor(diffMs / DAY_MS);
  if (days === 1) return "Last login yesterday";

  const relative = formatRelativePast(lastLoginAt);
  return relative === "Unknown" ? "Never logged in" : `Last login ${relative}`;
}

/** e.g. "Joined 3 months ago". */
export function formatJoinedLabel(
  createdAt: string | null | undefined,
): string {
  if (!createdAt) return "Unknown";
  const relative = formatRelativePast(createdAt);
  if (relative === "Unknown") return "Unknown";
  return `Joined ${relative}`;
}

/** Compact badge label for list views, never claims active without lastActiveAt. */
export function activityRecencyLabel(
  lastActiveAt: string | null | undefined,
): string {
  if (!lastActiveAt) return "No activity";

  const date = parseIso(lastActiveAt);
  if (!date) return "No activity";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < DAY_MS) return "Active today";
  if (diffMs < 7 * DAY_MS) return "Active this week";
  if (diffMs < 30 * DAY_MS) return "Inactive 7+ days";
  return "Inactive 30+ days";
}

export function activityRecencyTone(
  lastActiveAt: string | null | undefined,
): "success" | "warning" | "neutral" | "danger" {
  if (!lastActiveAt) return "neutral";

  const date = parseIso(lastActiveAt);
  if (!date) return "neutral";

  const diffMs = Date.now() - date.getTime();
  if (diffMs < DAY_MS) return "success";
  if (diffMs < 7 * DAY_MS) return "warning";
  if (diffMs < 30 * DAY_MS) return "neutral";
  return "danger";
}

export function statusEventLabel(
  action: "user_disable" | "user_enable",
): string {
  return action === "user_disable" ? "Account disabled" : "Account re-enabled";
}
