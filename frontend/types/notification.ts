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

export interface AppNotification {
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

export interface NotificationListResponse {
  items: AppNotification[];
  unreadCount: number;
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

export function notificationSeverityTone(
  severity: NotificationSeverity,
): "danger" | "warning" | "info" {
  if (severity === "critical") return "danger";
  if (severity === "warning") return "warning";
  return "info";
}
