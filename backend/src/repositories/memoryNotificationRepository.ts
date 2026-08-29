import type { NotificationRecord } from "../models/notification";
import type { NotificationRepository } from "./notification.types";
import { memoryStore } from "./memoryStore";

export const memoryNotificationRepository: NotificationRepository = {
  async findByUserId(userId, options = {}) {
    const includeDismissed = options.includeDismissed === true;
    return memoryStore.notifications
      .filter(
        (n) => n.userId === userId && (includeDismissed || !n.dismissedAt),
      )
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async findById(id) {
    return memoryStore.notifications.find((n) => n.id === id) || null;
  },

  async findByDedupeKey(userId, dedupeKey) {
    return (
      memoryStore.notifications.find(
        (n) =>
          n.userId === userId && n.dedupeKey === dedupeKey && !n.dismissedAt,
      ) || null
    );
  },

  async create(record) {
    memoryStore.notifications.push(record);
    return record;
  },

  async update(id, patch) {
    const index = memoryStore.notifications.findIndex((n) => n.id === id);
    if (index < 0) return null;
    const current = memoryStore.notifications[index]!;
    const next: NotificationRecord = {
      ...current,
      ...patch,
      id: current.id,
      userId: current.userId,
      dedupeKey: current.dedupeKey,
    };
    memoryStore.notifications[index] = next;
    return next;
  },

  async delete(id) {
    const index = memoryStore.notifications.findIndex((n) => n.id === id);
    if (index < 0) return false;
    memoryStore.notifications.splice(index, 1);
    return true;
  },

  async markAllRead(userId) {
    const now = new Date().toISOString();
    let count = 0;
    for (const n of memoryStore.notifications) {
      if (n.userId === userId && !n.dismissedAt && !n.readAt) {
        n.readAt = now;
        count += 1;
      }
    }
    return count;
  },

  async countUnread(userId) {
    return memoryStore.notifications.filter(
      (n) => n.userId === userId && !n.dismissedAt && !n.readAt,
    ).length;
  },
};
