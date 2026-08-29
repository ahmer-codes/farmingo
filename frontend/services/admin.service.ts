import type {
  AdminAnalytics,
  AdminDashboardResponse,
  AdminDashboardStats,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserActivity,
  AdminUserStats,
  DashboardRange,
  Paginated,
} from "~/types/admin";
import type { SupportConversation, SupportMessagePage } from "~/types/support";
import { apiRequest } from "./apiClient";

type Query = Record<string, string | number | boolean | undefined>;

export const adminService = {
  dashboard(range?: DashboardRange) {
    return apiRequest<AdminDashboardResponse>("/admin/dashboard", {
      query: { range },
    });
  },

  dashboardStats() {
    return apiRequest<AdminDashboardStats>("/admin/dashboard/stats");
  },

  dashboardAnalytics() {
    return apiRequest<AdminAnalytics>("/admin/dashboard/analytics");
  },

  usersStats() {
    return apiRequest<AdminUserStats>("/admin/users/stats");
  },

  listUsers(query?: Query) {
    return apiRequest<Paginated<AdminUserListItem>>("/admin/users", { query });
  },

  getUser(uid: string) {
    return apiRequest<AdminUserDetail>(`/admin/users/${uid}`);
  },

  patchUserStatus(uid: string, status: "active" | "disabled") {
    return apiRequest<AdminUserActivity>(`/admin/users/${uid}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  listUserConversations(uid: string) {
    return apiRequest<SupportConversation[]>(
      `/admin/users/${uid}/conversations`,
    );
  },

  listFarms(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>("/admin/farms", {
      query,
    });
  },

  listFields(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>("/admin/fields", {
      query,
    });
  },

  listCrops(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>("/admin/crops", {
      query,
    });
  },

  listYields(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>("/admin/yields", {
      query,
    });
  },

  listDisease(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>(
      "/admin/disease-assessments",
      { query },
    );
  },

  listTasks(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>("/admin/tasks", {
      query,
    });
  },

  listTreatmentPlans(query?: Query) {
    return apiRequest<Paginated<Record<string, unknown>>>(
      "/admin/treatment-plans",
      { query },
    );
  },

  chatStats() {
    return apiRequest<{
      unreadConversations: number;
      openConversations: number;
    }>("/admin/conversations/stats");
  },

  listConversations(query?: Query) {
    return apiRequest<Paginated<SupportConversation>>("/admin/conversations", {
      query,
    });
  },

  getConversation(conversationId: string) {
    return apiRequest<SupportConversation>(
      `/admin/conversations/${conversationId}`,
    );
  },

  listMessages(conversationId: string, query?: Query) {
    return apiRequest<SupportMessagePage>(
      `/admin/conversations/${conversationId}/messages`,
      {
        query,
      },
    );
  },

  sendMessage(conversationId: string, text: string) {
    return apiRequest<{ id: string; text: string; createdAt: string }>(
      `/admin/conversations/${conversationId}/messages`,
      { method: "POST", body: { text } },
    );
  },

  markRead(conversationId: string) {
    return apiRequest<SupportConversation>(
      `/admin/conversations/${conversationId}/read`,
      {
        method: "POST",
      },
    );
  },

  clearConversation(conversationId: string) {
    return apiRequest<SupportConversation>(
      `/admin/conversations/${conversationId}/clear`,
      {
        method: "POST",
      },
    );
  },

  patchConversation(
    conversationId: string,
    body: { status?: string; priority?: string; assignedAdminId?: string },
  ) {
    return apiRequest<SupportConversation>(
      `/admin/conversations/${conversationId}`,
      {
        method: "PATCH",
        body,
      },
    );
  },
};
