import { randomUUID } from "crypto";
import type {
  CreateNotificationInput,
  NotificationType,
  PublicNotification,
} from "../../models/notification";
import type { NotificationPreferences } from "../../models/user";
import { DEFAULT_PREFERENCES } from "../../models/user";
import { notificationRepository, userRepository } from "../../repositories";
import { ApiError } from "../../utils/ApiError";
import {
  EmailNotificationChannel,
  InAppNotificationChannel,
  PushNotificationChannel,
  SmsNotificationChannel,
  type NotificationChannel,
} from "./channels";
import { env } from "../../config";

function preferenceAllows(
  type: NotificationType,
  prefs: NotificationPreferences,
): boolean {
  switch (type) {
    case "weather_alert":
      return prefs.weatherAlerts;
    case "disease_alert":
      return prefs.diseaseAlerts;
    case "task_reminder":
    case "overdue_task":
      return prefs.taskReminders;
    case "treatment_followup":
      return prefs.treatmentReminders;
    case "yield_reminder":
    case "general":
      return prefs.generalNotifications;
    default:
      return true;
  }
}

function toPublic(record: {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: CreateNotificationInput["severity"];
  createdAt: string;
  readAt: string | null;
  relatedResource?: CreateNotificationInput["relatedResource"];
  action?: CreateNotificationInput["action"];
}): PublicNotification {
  return {
    id: record.id,
    title: record.title,
    message: record.message,
    type: record.type,
    severity: record.severity,
    createdAt: record.createdAt,
    read: Boolean(record.readAt),
    relatedResource: record.relatedResource,
    action: record.action,
  };
}

function buildChannels(): NotificationChannel[] {
  const externalEnabled = Boolean(env.NOTIFICATION_API_KEY);
  return [
    new InAppNotificationChannel(),
    new EmailNotificationChannel(
      externalEnabled && env.NOTIFICATION_PROVIDER === "email",
    ),
    new PushNotificationChannel(
      externalEnabled && env.NOTIFICATION_PROVIDER === "push",
    ),
    new SmsNotificationChannel(
      externalEnabled && env.NOTIFICATION_PROVIDER === "sms",
    ),
  ];
}

/**
 * Central notification service.
 * Task / weather / disease code creates notifications here;
 * delivery channels can expand later without rewriting those callers.
 */
export class NotificationService {
  constructor(
    private readonly channels: NotificationChannel[] = buildChannels(),
  ) {}

  async create(
    input: CreateNotificationInput,
  ): Promise<PublicNotification | null> {
    const user = await userRepository.findById(input.userId);
    if (!user) return null;

    const prefs: NotificationPreferences = {
      ...DEFAULT_PREFERENCES.notifications,
      ...user.preferences.notifications,
    };
    if (!preferenceAllows(input.type, prefs)) {
      return null;
    }

    const existing = await notificationRepository.findByDedupeKey(
      input.userId,
      input.dedupeKey,
    );
    if (existing) {
      return null;
    }

    const now = new Date().toISOString();
    const record = await notificationRepository.create({
      id: randomUUID(),
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      severity: input.severity,
      createdAt: now,
      readAt: null,
      dismissedAt: null,
      dedupeKey: input.dedupeKey,
      relatedResource: input.relatedResource,
      action: input.action,
    });

    await Promise.all(
      this.channels.map(async (channel) => {
        try {
          await channel.deliver(record);
        } catch (err) {
          console.error(`[notification] channel ${channel.name} failed`, err);
        }
      }),
    );

    return toPublic(record);
  }

  async list(userId: string): Promise<PublicNotification[]> {
    const rows = await notificationRepository.findByUserId(userId);
    return rows.map(toPublic);
  }

  async unreadCount(userId: string): Promise<number> {
    return notificationRepository.countUnread(userId);
  }

  async markRead(userId: string, id: string): Promise<PublicNotification> {
    const row = await notificationRepository.findById(id);
    if (!row || row.userId !== userId || row.dismissedAt) {
      throw new ApiError(404, "Notification not found");
    }
    if (!row.readAt) {
      await notificationRepository.update(id, {
        readAt: new Date().toISOString(),
      });
    }
    const updated = await notificationRepository.findById(id);
    return toPublic(updated!);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const updated = await notificationRepository.markAllRead(userId);
    return { updated };
  }

  async dismiss(userId: string, id: string): Promise<void> {
    const row = await notificationRepository.findById(id);
    if (!row || row.userId !== userId || row.dismissedAt) {
      throw new ApiError(404, "Notification not found");
    }
    await notificationRepository.update(id, {
      dismissedAt: new Date().toISOString(),
      readAt: row.readAt || new Date().toISOString(),
    });
  }
}

export const notificationService = new NotificationService();
