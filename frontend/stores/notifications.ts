import { defineStore } from "pinia";
import type { AppNotification } from "~/types/notification";
import { notificationService } from "~/services/notification.service";

const NOTIFICATION_STALE_MS = 2 * 60 * 1000;

interface NotificationState {
  items: AppNotification[];
  unreadCount: number;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  lastFetchedAt: number | null;
  refreshing: boolean;
  markingAllRead: boolean;
  pendingActionId: string | null;
  pendingActionType: "read" | "dismiss" | null;
}

let inflightRefresh: Promise<void> | null = null;

export const useNotificationStore = defineStore("notifications", {
  state: (): NotificationState => ({
    items: [],
    unreadCount: 0,
    status: "idle",
    error: null,
    lastFetchedAt: null,
    refreshing: false,
    markingAllRead: false,
    pendingActionId: null,
    pendingActionType: null,
  }),

  getters: {
    unreadItems: (state) => state.items.filter((n) => !n.read),
    isInitialLoad: (state) => state.status === "loading" && !state.items.length,
    isStale: (state) =>
      !state.lastFetchedAt ||
      Date.now() - state.lastFetchedAt > NOTIFICATION_STALE_MS,
  },

  actions: {
    async refresh(token: string, options: { force?: boolean } = {}) {
      if (!options.force && !this.isStale && this.items.length) {
        return;
      }

      if (inflightRefresh) {
        await inflightRefresh;
        return;
      }

      const hasItems = this.items.length > 0;
      if (hasItems) {
        this.refreshing = true;
      } else {
        this.status = "loading";
      }
      this.error = null;

      inflightRefresh = (async () => {
        try {
          const data = await notificationService.list(token);
          this.items = data.items;
          this.unreadCount = data.unreadCount;
          this.lastFetchedAt = Date.now();
          this.status = "success";
        } catch (err) {
          if (!hasItems) {
            this.status = "error";
            this.error =
              err instanceof Error
                ? err.message
                : "Unable to load notifications";
          }
          throw err;
        } finally {
          this.refreshing = false;
          inflightRefresh = null;
        }
      })();

      await inflightRefresh;
    },

    async refreshUnread(token: string) {
      if (!this.isStale) return;
      try {
        const data = await notificationService.unreadCount(token);
        this.unreadCount = data.unreadCount;
      } catch {
        /* keep prior count */
      }
    },

    async markRead(token: string, id: string) {
      if (this.pendingActionId) return;
      this.pendingActionId = id;
      this.pendingActionType = "read";
      try {
        const updated = await notificationService.markRead(token, id);
        const index = this.items.findIndex((n) => n.id === id);
        if (index >= 0) this.items[index] = updated;
        this.unreadCount = this.items.filter((n) => !n.read).length;
      } finally {
        this.pendingActionId = null;
        this.pendingActionType = null;
      }
    },

    async markAllRead(token: string) {
      if (this.markingAllRead) return;
      this.markingAllRead = true;
      try {
        await notificationService.markAllRead(token);
        this.items = this.items.map((n) => ({ ...n, read: true }));
        this.unreadCount = 0;
      } finally {
        this.markingAllRead = false;
      }
    },

    async dismiss(token: string, id: string) {
      if (this.pendingActionId) return;
      this.pendingActionId = id;
      this.pendingActionType = "dismiss";
      try {
        await notificationService.dismiss(token, id);
        this.items = this.items.filter((n) => n.id !== id);
        this.unreadCount = this.items.filter((n) => !n.read).length;
      } finally {
        this.pendingActionId = null;
        this.pendingActionType = null;
      }
    },

    reset() {
      this.items = [];
      this.unreadCount = 0;
      this.status = "idle";
      this.error = null;
      this.lastFetchedAt = null;
      this.refreshing = false;
    },
  },
});
