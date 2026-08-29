import type { NotificationRecord } from "../models/notification";

export interface NotificationRepository {
  findByUserId(
    userId: string,
    options?: { includeDismissed?: boolean },
  ): Promise<NotificationRecord[]>;
  findById(id: string): Promise<NotificationRecord | null>;
  findByDedupeKey(
    userId: string,
    dedupeKey: string,
  ): Promise<NotificationRecord | null>;
  create(record: NotificationRecord): Promise<NotificationRecord>;
  update(
    id: string,
    patch: Partial<NotificationRecord>,
  ): Promise<NotificationRecord | null>;
  delete(id: string): Promise<boolean>;
  markAllRead(userId: string): Promise<number>;
  countUnread(userId: string): Promise<number>;
}
