import type { NotificationRecord } from "../../models/notification";

/**
 * Delivery channel abstraction.
 * In-app is the default. Email / push / SMS can be added later
 * without changing task or scheduler logic.
 */
export interface NotificationChannel {
  readonly name: string;
  deliver(notification: NotificationRecord): Promise<void>;
}

export class InAppNotificationChannel implements NotificationChannel {
  readonly name = "in_app";

  async deliver(_notification: NotificationRecord): Promise<void> {
    // Persistence already happened in NotificationService.
    // Future: websocket / SSE fan-out to connected clients.
  }
}

/** Placeholder, wire a provider behind NOTIFICATION_API_KEY later. */
export class EmailNotificationChannel implements NotificationChannel {
  readonly name = "email";
  constructor(private readonly enabled = false) {}

  async deliver(notification: NotificationRecord): Promise<void> {
    if (!this.enabled) return;
    console.info(
      `[notification:email] skipped stub → ${notification.userId}: ${notification.title}`,
    );
  }
}

export class PushNotificationChannel implements NotificationChannel {
  readonly name = "push";
  constructor(private readonly enabled = false) {}

  async deliver(notification: NotificationRecord): Promise<void> {
    if (!this.enabled) return;
    console.info(
      `[notification:push] skipped stub → ${notification.userId}: ${notification.title}`,
    );
  }
}

export class SmsNotificationChannel implements NotificationChannel {
  readonly name = "sms";
  constructor(private readonly enabled = false) {}

  async deliver(notification: NotificationRecord): Promise<void> {
    if (!this.enabled) return;
    console.info(
      `[notification:sms] skipped stub → ${notification.userId}: ${notification.title}`,
    );
  }
}
