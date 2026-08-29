export type DashboardRange = "7d" | "30d" | "90d" | "180d" | "365d";

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

export interface AdminDashboardMeta {
  range: DashboardRange;
  rangeStart: string;
  rangeEnd: string;
  truncated: boolean;
  limits: Record<string, number>;
}

export interface AdminDashboardResponse {
  kpis: AdminDashboardKpis;
  analytics: AdminDashboardAnalytics;
  meta: AdminDashboardMeta;
}

/** @deprecated Use AdminDashboardResponse via /admin/dashboard */
export interface AdminDashboardStats {
  totalUsers: number;
  totalFarms: number;
  totalFields: number;
  totalCrops: number;
  totalDiseaseAssessments: number;
  totalTreatmentPlans: number;
  openTasks: number;
  completedTasks: number;
  totalYieldRecords: number;
  unreadAdminMessages: number;
  unreadConversations: number;
  openSupportConversations: number;
  activeToday: number;
  activeLast7Days: number;
  inactive7PlusDays: number;
  newUsersThisMonth: number;
}

/** @deprecated Use AdminDashboardResponse via /admin/dashboard */
export interface AdminAnalytics {
  userGrowth: Array<{ month: string; count: number }>;
  cropDistribution: Array<{ label: string; value: number }>;
  diseaseByDisease: Array<{ label: string; value: number }>;
  diseaseByCrop: Array<{ label: string; value: number }>;
  taskStatus: Array<{ label: string; value: number }>;
  yieldTrend: Array<{
    month: string;
    expected: number;
    actual: number;
    records: number;
  }>;
  farmStatistics: Array<{ label: string; value: number }>;
  sampleLimits: Record<string, number>;
}

export const DASHBOARD_RANGE_OPTIONS: Array<{
  value: DashboardRange;
  label: string;
}> = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "3 months" },
  { value: "180d", label: "6 months" },
  { value: "365d", label: "12 months" },
];

export const ADMIN_CHART_COLORS = [
  "#1a4d2e",
  "#2563eb",
  "#d97706",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
  "#0891b2",
  "#65a30d",
];

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  searchMode?: "exact_email" | "prefix" | null;
}

export interface AdminUserStats {
  totalUsers: number;
  activeToday: number;
  activeThisWeek: number;
  disabledUsers: number;
  newUsersThisMonth: number;
}

export type AdminUserActivityFilter =
  | "active_today"
  | "active_week"
  | "inactive_7d"
  | "never_active";

export interface AdminUserStatusEvent {
  action: "user_disable" | "user_enable";
  adminId: string;
  createdAt: string;
}

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

export type UserStatus = "active" | "disabled";
export type AccountType = "farmer" | "admin";

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

export interface AdminUserDetail {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
    createdAt: string;
  };
  activity: AdminUserActivity;
  farm: import("~/types/auth").FarmProfile | null;
  fields: import("~/types/crop").FarmField[];
  crops: import("~/types/crop").FarmCrop[];
  tasks: import("~/types/task").WorkTask[];
  yields: import("~/types/crop").YieldObservation[];
  diseaseAssessments: import("~/types/disease").DiseaseAssessmentRecord[];
  treatmentPlans: import("~/types/task").TreatmentPlan[];
  conversation: import("~/types/support").SupportConversation | null;
  conversations: import("~/types/support").SupportConversation[];
  statusHistory: AdminUserStatusEvent[];
  summaries: AdminUserSummaries;
}

export const ADMIN_USER_ACTIVITY_FILTER_OPTIONS: Array<{
  value: AdminUserActivityFilter | "";
  label: string;
}> = [
  { value: "", label: "All activity" },
  { value: "active_today", label: "Active today" },
  { value: "active_week", label: "Active this week" },
  { value: "inactive_7d", label: "Inactive 7+ days" },
  { value: "never_active", label: "Never active" },
];

export const ADMIN_USER_JOINED_FILTER_OPTIONS: Array<{
  value: string;
  label: string;
}> = [
  { value: "", label: "Any join date" },
  { value: "this_month", label: "Joined this month" },
  { value: "30d", label: "Joined last 30 days" },
  { value: "90d", label: "Joined last 90 days" },
];

/** Firestore supports prefix search on email/fullNameLower, not arbitrary substrings. */
export const ADMIN_USER_SEARCH_HELP =
  "Search by exact email or prefix match at the start of email or name. Substring search is not supported.";
