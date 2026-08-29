import type {
  AppNotification,
  NotificationListResponse,
} from "~/types/notification";
import { apiRequest } from "./apiClient";

export const notificationService = {
  list(token: string): Promise<NotificationListResponse> {
    return apiRequest<NotificationListResponse>("/notifications", { token });
  },

  unreadCount(token: string): Promise<{ unreadCount: number }> {
    return apiRequest<{ unreadCount: number }>("/notifications/unread-count", {
      token,
    });
  },

  markRead(token: string, id: string): Promise<AppNotification> {
    return apiRequest<AppNotification>(`/notifications/${id}/read`, {
      method: "POST",
      token,
    });
  },

  markAllRead(token: string): Promise<{ updated: number }> {
    return apiRequest<{ updated: number }>("/notifications/read-all", {
      method: "POST",
      token,
    });
  },

  dismiss(
    token: string,
    id: string,
  ): Promise<{ id: string; dismissed: boolean }> {
    return apiRequest<{ id: string; dismissed: boolean }>(
      `/notifications/${id}`,
      {
        method: "DELETE",
        token,
      },
    );
  },
};
