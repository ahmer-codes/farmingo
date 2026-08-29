import type { AccountType, UserRecord, UserStatus } from "../../models/user";
import { effectiveUserStatus } from "../../utils/userAccessCache";

export interface AdminUserListItem {
  id: string;
  email: string;
  fullName: string;
  accountType: AccountType | null;
  status: UserStatus;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  counts: {
    farms: number;
    crops: number;
    tasks: number;
  };
}

export interface AdminUserStatusEvent {
  action: "user_disable" | "user_enable";
  adminId: string;
  createdAt: string;
}

export interface AdminUserActivity {
  status: UserStatus;
  accountType: AccountType | null;
  lastLoginAt: string | null;
  lastActiveAt: string | null;
  disabledAt: string | null;
  createdAt: string;
}

export interface AdminUserSummaries {
  tasks: { total: number; open: number; completed: number };
  yields: { total: number; expectedTotal: number; actualTotal: number };
  diseaseAssessments: { total: number };
  treatmentPlans: { total: number };
  fields: { total: number };
  crops: { total: number };
}

export function toAdminUserListItem(
  user: UserRecord,
  counts: AdminUserListItem["counts"],
): AdminUserListItem {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    accountType: user.accountType ?? null,
    status: effectiveUserStatus(user),
    lastLoginAt: user.lastLoginAt ?? null,
    lastActiveAt: user.lastActiveAt ?? null,
    createdAt: user.createdAt,
    counts,
  };
}

export function toAdminUserActivity(user: UserRecord): AdminUserActivity {
  return {
    status: effectiveUserStatus(user),
    accountType: user.accountType ?? null,
    lastLoginAt: user.lastLoginAt ?? null,
    lastActiveAt: user.lastActiveAt ?? null,
    disabledAt: user.disabledAt ?? null,
    createdAt: user.createdAt,
  };
}

/**
 * Firestore prefix search is case-sensitive on stored values.
 * We store lowercase email + fullNameLower for reliable prefix matching.
 * Arbitrary substring search (e.g. matching email domain middle) is not supported without a dedicated search service.
 */
export const ADMIN_USER_SEARCH_LIMITATION =
  "Search supports exact email match and prefix match on email or full name (from the start of the value). Substring search is not supported.";
