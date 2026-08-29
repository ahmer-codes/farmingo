import cron from "node-cron";
import { env, isDev } from "../../config";
import {
  runTaskNotificationSweep,
  runWeatherNotificationSweep,
  runYieldReminderSweep,
} from "./jobs";
import { runSupportAutoReplySweep } from "../supportChatJobs";

const timeZone = env.NOTIFICATION_TIMEZONE || "Asia/Karachi";

async function safeRun(label: string, fn: () => Promise<number>) {
  try {
    const created = await fn();
    if (isDev && created > 0) {
      console.log(`[scheduler:${label}] created ${created} notification(s)`);
    }
  } catch (err) {
    console.error(`[scheduler:${label}] failed`, err);
  }
}

/**
 * Background jobs stay on Express, never in Nuxt.
 * Cron expressions use NOTIFICATION_TIMEZONE (default Asia/Karachi).
 */
export function startNotificationScheduler() {
  // Upcoming / overdue / treatment task reminders, every minute
  cron.schedule(
    "* * * * *",
    () => {
      void safeRun("tasks", () => runTaskNotificationSweep(timeZone));
    },
    { timezone: timeZone },
  );

  cron.schedule(
    "* * * * *",
    () => {
      void safeRun("support:auto-reply", () => runSupportAutoReplySweep());
    },
    { timezone: timeZone },
  );

  // Weather risks, every 15 minutes
  cron.schedule(
    "*/15 * * * *",
    () => {
      void safeRun("weather", () => runWeatherNotificationSweep());
    },
    { timezone: timeZone },
  );

  // Yield logging nudges, hourly (job self-gates to morning hours)
  cron.schedule(
    "0 * * * *",
    () => {
      void safeRun("yield", () => runYieldReminderSweep(timeZone));
    },
    { timezone: timeZone },
  );

  // Kick once shortly after boot so the notification center is not empty in dev
  setTimeout(() => {
    void safeRun("tasks:boot", () => runTaskNotificationSweep(timeZone));
    void safeRun("weather:boot", () => runWeatherNotificationSweep());
    void safeRun("support:auto-reply:boot", () => runSupportAutoReplySweep());
  }, 2500);

  console.log(`[scheduler] notification jobs started (tz=${timeZone})`);
}
