export type NotificationType =
  | "weather_alert"
  | "disease_alert"
  | "task_reminder"
  | "overdue_task"
  | "treatment_followup"
  | "yield_reminder"
  | "general";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationRelatedResource {
  kind: "task" | "treatment_plan" | "weather" | "disease" | "yield" | "farm";
  id: string;
  label?: string;
}

export interface NotificationAction {
  label: string;
  href: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  createdAt: string;
  readAt: string | null;
  dismissedAt: string | null;
  /** Stable key so schedulers do not re-create the same alert */
  dedupeKey: string;
  relatedResource?: NotificationRelatedResource;
  action?: NotificationAction;
}

export interface PublicNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  relatedResource?: NotificationRelatedResource;
  action?: NotificationAction;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  dedupeKey: string;
  relatedResource?: NotificationRelatedResource;
  action?: NotificationAction;
}

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  weather_alert: "Weather Alert",
  disease_alert: "Disease Alert",
  task_reminder: "Task Reminder",
  overdue_task: "Overdue Task",
  treatment_followup: "Treatment Follow-up",
  yield_reminder: "Yield Reminder",
  general: "General Farm Notification",
};
