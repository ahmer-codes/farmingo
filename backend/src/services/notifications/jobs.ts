import {
  farmRepository,
  taskRepository,
  userRepository,
} from "../../repositories";
import { resolveTaskStatus } from "../task.service";
import { weatherService } from "../weather";
import { notificationService } from "./notification.service";

/** Wall-clock parts in a target IANA timezone. */
export function zonedParts(date: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt
      .formatToParts(date)
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    minutesOfDay: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

function parseHm(hm: string): number {
  const [h, m] = hm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function severityFromPriority(
  priority: string,
): "info" | "warning" | "critical" {
  if (priority === "high") return "warning";
  return "info";
}

/**
 * Task reminders + overdue + treatment follow-ups from open tasks.
 */
export async function runTaskNotificationSweep(
  timeZone: string,
): Promise<number> {
  const now = new Date();
  const { date: today, minutesOfDay } = zonedParts(now, timeZone);

  const overdueStart = new Date(`${today}T12:00:00.000Z`);
  overdueStart.setUTCDate(overdueStart.getUTCDate() - 30);
  const start = overdueStart.toISOString().slice(0, 10);
  const endDate = new Date(`${today}T12:00:00.000Z`);
  endDate.setUTCDate(endDate.getUTCDate() + 7);
  const end = endDate.toISOString().slice(0, 10);

  const tasks = await taskRepository.listDueInRange(start, end);
  const disabledUserIds = new Set(
    (await userRepository.listAll())
      .filter((user) => user.status === "disabled")
      .map((user) => user.id),
  );
  let created = 0;

  for (const task of tasks) {
    if (disabledUserIds.has(task.userId)) continue;

    const status = resolveTaskStatus(task, today);
    if (status === "completed" || status === "skipped") continue;

    const dueMinutes = parseHm(task.dueTime || "09:00");
    const reminderMinutes = parseHm(
      task.reminderTime || task.dueTime || "09:00",
    );
    const isTreatment = task.source === "disease_treatment";

    // Overdue: past due date, or due today and past due time by 30+ minutes
    const isOverdueDate = task.dueDate < today;
    const isOverdueToday =
      task.dueDate === today && minutesOfDay >= dueMinutes + 30;

    if (isOverdueDate || isOverdueToday) {
      const result = await notificationService.create({
        userId: task.userId,
        type: "overdue_task",
        title: `Overdue: ${task.title}`,
        message: `${task.crop} · ${task.field} was due ${task.dueDate} at ${task.dueTime}. Complete or reschedule this field task.`,
        severity: task.priority === "high" ? "critical" : "warning",
        dedupeKey: `overdue_task:${task.id}:${today}`,
        relatedResource: { kind: "task", id: task.id, label: task.title },
        action: { label: "Open task", href: `/tasks?task=${task.id}` },
      });
      if (result) created += 1;
      continue;
    }

    // Reminder window: on due date, from reminder time through due time + 90 minutes
    if (task.dueDate !== today) continue;
    if (minutesOfDay < reminderMinutes) continue;
    if (minutesOfDay > dueMinutes + 90) continue;

    if (isTreatment) {
      const result = await notificationService.create({
        userId: task.userId,
        type: "treatment_followup",
        title: `Treatment follow-up: ${task.title}`,
        message: `${task.relatedDisease || "Treatment"} for ${task.crop} is scheduled at ${task.dueTime}. ${task.instructions || task.description}`,
        severity: severityFromPriority(task.priority),
        dedupeKey: `treatment_followup:${task.id}:${task.dueDate}`,
        relatedResource: {
          kind: "treatment_plan",
          id: task.treatmentPlanId || task.id,
          label: task.relatedDisease || task.title,
        },
        action: {
          label: "View treatment task",
          href: `/tasks?task=${task.id}`,
        },
      });
      if (result) created += 1;
    } else {
      const result = await notificationService.create({
        userId: task.userId,
        type: "task_reminder",
        title: `Reminder: ${task.title}`,
        message:
          `${task.crop} · ${task.field} is due today at ${task.dueTime}. ${task.description}`.trim(),
        severity: severityFromPriority(task.priority),
        dedupeKey: `task_reminder:${task.id}:${task.dueDate}:${task.reminderTime || task.dueTime}`,
        relatedResource: { kind: "task", id: task.id, label: task.title },
        action: { label: "Open task", href: `/tasks?task=${task.id}` },
      });
      if (result) created += 1;
    }
  }

  return created;
}

/**
 * Weather risk alerts from the weather intelligence service.
 */
export async function runWeatherNotificationSweep(): Promise<number> {
  const users = await userRepository.listAll();
  let created = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    if (user.status === "disabled") continue;
    if (!user.preferences.notifications.weatherAlerts) continue;
    const farm = await farmRepository.findByOwnerId(user.id);
    if (!farm?.location) continue;

    try {
      const weather = await weatherService.getCurrent(user.id);

      for (const rec of weather.recommendations) {
        if (rec.severity === "info" && rec.ruleId !== "rain_expected_soon")
          continue;

        const severity =
          rec.severity === "critical"
            ? "critical"
            : rec.severity === "warning" || rec.severity === "watch"
              ? "warning"
              : "info";

        const dedupeKey = `weather:${farm.id}:${rec.ruleId || rec.id}:${today}`;

        const fieldLabel = rec.fieldName
          ? `${rec.cropType}, ${rec.fieldName}`
          : rec.cropType;
        const timingNote = rec.timing ? `${rec.timing}. ` : "";
        const message = `${timingNote}${rec.description} Recommended: ${rec.recommendedAction}`;

        const result = await notificationService.create({
          userId: user.id,
          type: "weather_alert",
          title: rec.title,
          message: fieldLabel ? `${fieldLabel}. ${message}` : message,
          severity,
          dedupeKey,
          relatedResource: {
            kind: "weather",
            id: rec.ruleId || rec.id,
            label: rec.title,
          },
          action: rec.fieldId
            ? { label: "View field", href: "/crops" }
            : { label: "View weather", href: "/weather" },
        });
        if (result) created += 1;
      }
    } catch (err) {
      console.warn(
        `[notification:weather] skip user ${user.id}`,
        err instanceof Error ? err.message : err,
      );
    }
  }

  return created;
}

/**
 * Light yield / harvest logging nudge once per calendar month in harvest windows.
 */
export async function runYieldReminderSweep(timeZone: string): Promise<number> {
  const now = new Date();
  const { date: today, hour } = zonedParts(now, timeZone);
  // Run only in morning hours to avoid spam if job fires often
  if (hour < 7 || hour > 10) return 0;

  const month = Number(today.slice(5, 7));
  const monthKey = today.slice(0, 7);
  const users = await userRepository.listAll();
  let created = 0;

  for (const user of users) {
    if (user.status === "disabled") continue;
    const farm = await farmRepository.findByOwnerId(user.id);
    if (!farm) continue;

    const crops = farm.primaryCrops.map((c) => c.toLowerCase());
    const harvestHints: string[] = [];
    if (
      crops.some((c) => c.includes("wheat")) &&
      (month === 4 || month === 5)
    ) {
      harvestHints.push("Wheat harvest window");
    }
    if (
      crops.some((c) => c.includes("cotton")) &&
      (month === 10 || month === 11)
    ) {
      harvestHints.push("Cotton pick window");
    }
    if (
      crops.some((c) => c.includes("corn") || c.includes("maize")) &&
      (month === 6 || month === 10)
    ) {
      harvestHints.push("Maize harvest window");
    }
    if (
      crops.some((c) => c.includes("rice")) &&
      (month === 10 || month === 11)
    ) {
      harvestHints.push("Rice harvest window");
    }

    if (!harvestHints.length) continue;

    const result = await notificationService.create({
      userId: user.id,
      type: "yield_reminder",
      title: "Log yield observations",
      message: `${harvestHints.join(" · ")} for ${farm.name}. Record expected vs actual yield while field conditions are fresh.`,
      severity: "info",
      dedupeKey: `yield_reminder:${user.id}:${monthKey}`,
      relatedResource: { kind: "yield", id: farm.id, label: farm.name },
      action: { label: "Open yield", href: "/yield" },
    });
    if (result) created += 1;
  }

  return created;
}
