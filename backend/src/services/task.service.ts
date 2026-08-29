import { randomUUID } from "crypto";
import type {
  PublicTask,
  TaskPriority,
  TaskRecord,
  TaskSource,
  TaskStatus,
} from "../models/task";
import { taskRepository } from "../repositories";
import { ApiError } from "../utils/ApiError";
import { notificationService } from "./notifications";

export type TaskListFilter =
  | "all"
  | "today"
  | "upcoming"
  | "completed"
  | "overdue"
  | "disease_treatment"
  | "weather_precaution"
  | "farmer_created"
  | "seasonal_recommendation";

export interface CreateTaskInput {
  title: string;
  description: string;
  crop: string;
  field?: string;
  priority: TaskPriority;
  dueDate: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  source?: TaskSource;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  crop?: string;
  field?: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  estimatedDurationMinutes?: number;
  status?: Exclude<TaskStatus, "overdue">;
  reason?: string;
  instructions?: string;
  relatedDisease?: string;
  reminderTime?: string;
}

function todayIsoDate(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function resolveTaskStatus(
  task: TaskRecord,
  today = todayIsoDate(),
): TaskStatus {
  if (task.status === "completed" || task.status === "skipped")
    return task.status;
  if (
    task.dueDate < today &&
    (task.status === "pending" || task.status === "in_progress")
  ) {
    return "overdue";
  }
  return task.status;
}

export function toPublicTask(
  task: TaskRecord,
  today = todayIsoDate(),
): PublicTask {
  const status = resolveTaskStatus(task, today);
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    crop: task.crop,
    field: task.field,
    priority: task.priority,
    dueDate: task.dueDate,
    dueTime: task.dueTime,
    estimatedDurationMinutes: task.estimatedDurationMinutes,
    status,
    source: task.source,
    reason: task.reason,
    instructions: task.instructions,
    relatedDisease: task.relatedDisease,
    reminderTime: task.reminderTime,
    treatmentPlanId: task.treatmentPlanId,
    dayOffset: task.dayOffset,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    completedAt: task.completedAt,
  };
}

function matchesFilter(
  task: PublicTask,
  filter: TaskListFilter,
  today: string,
) {
  switch (filter) {
    case "today":
      return (
        task.dueDate === today &&
        task.status !== "completed" &&
        task.status !== "skipped"
      );
    case "upcoming":
      return (
        task.dueDate > today &&
        task.status !== "completed" &&
        task.status !== "skipped"
      );
    case "completed":
      return task.status === "completed";
    case "overdue":
      return task.status === "overdue";
    case "disease_treatment":
      return task.source === "disease_treatment";
    case "weather_precaution":
      return task.source === "weather_precaution";
    case "farmer_created":
      return task.source === "farmer_created";
    case "seasonal_recommendation":
      return task.source === "seasonal_recommendation";
    default:
      return true;
  }
}

export const taskService = {
  async list(userId: string, filter: TaskListFilter = "all") {
    const today = todayIsoDate();
    const rows = await taskRepository.listByUser(userId);
    const publicTasks = rows
      .map((t) => toPublicTask(t, today))
      .filter((t) => matchesFilter(t, filter, today))
      .sort((a, b) => {
        if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        return a.dueTime.localeCompare(b.dueTime);
      });

    const all = rows.map((t) => toPublicTask(t, today));
    return {
      tasks: publicTasks,
      summary: {
        today: all.filter((t) => matchesFilter(t, "today", today)).length,
        upcoming: all.filter((t) => matchesFilter(t, "upcoming", today)).length,
        overdue: all.filter((t) => matchesFilter(t, "overdue", today)).length,
        completed: all.filter((t) => matchesFilter(t, "completed", today))
          .length,
      },
    };
  },

  async get(userId: string, taskId: string) {
    const task = await taskRepository.findByIdForUser(taskId, userId);
    if (!task) throw new ApiError(404, "Task not found");
    return toPublicTask(task);
  },

  async create(userId: string, input: CreateTaskInput) {
    const now = new Date().toISOString();
    const task: TaskRecord = {
      id: randomUUID(),
      userId,
      title: input.title.trim(),
      description: input.description.trim(),
      crop: input.crop.trim(),
      field: (input.field || "").trim() || "General",
      priority: input.priority,
      dueDate: input.dueDate,
      dueTime: input.dueTime || "08:00",
      estimatedDurationMinutes: input.estimatedDurationMinutes ?? 30,
      status: "pending",
      source: input.source || "farmer_created",
      reason: input.reason,
      instructions: input.instructions || input.description.trim(),
      relatedDisease: input.relatedDisease,
      reminderTime: input.reminderTime,
      createdAt: now,
      updatedAt: now,
    };
    await taskRepository.create(task);

    // Same-day reminders can surface on the next scheduler tick
    if (task.dueDate === todayIsoDate()) {
      const isTreatment = task.source === "disease_treatment";
      await notificationService.create({
        userId,
        type: isTreatment ? "treatment_followup" : "task_reminder",
        title: isTreatment
          ? `Treatment scheduled: ${task.title}`
          : `Task scheduled: ${task.title}`,
        message: `${task.crop} · due ${task.dueDate} at ${task.dueTime}. Reminder set for ${task.reminderTime || task.dueTime}.`,
        severity: task.priority === "high" ? "warning" : "info",
        dedupeKey: isTreatment
          ? `treatment_followup:${task.id}:${task.dueDate}`
          : `task_reminder:${task.id}:${task.dueDate}:${task.reminderTime || task.dueTime}`,
        relatedResource: { kind: "task", id: task.id, label: task.title },
        action: { label: "Open task", href: `/tasks?task=${task.id}` },
      });
    }

    return toPublicTask(task);
  },

  async update(userId: string, taskId: string, input: UpdateTaskInput) {
    const existing = await taskRepository.findByIdForUser(taskId, userId);
    if (!existing) throw new ApiError(404, "Task not found");

    const patch: Partial<TaskRecord> = { ...input };
    if (input.status === "completed" && existing.status !== "completed") {
      patch.completedAt = new Date().toISOString();
    }
    if (input.status && input.status !== "completed") {
      patch.completedAt = undefined;
    }

    const updated = await taskRepository.update(taskId, userId, patch);
    if (!updated) throw new ApiError(404, "Task not found");
    return toPublicTask(updated);
  },

  async complete(userId: string, taskId: string) {
    return this.update(userId, taskId, { status: "completed" });
  },

  async remove(userId: string, taskId: string) {
    const ok = await taskRepository.delete(taskId, userId);
    if (!ok) throw new ApiError(404, "Task not found");
    return { message: "Task deleted" };
  },

  addDays,
  todayIsoDate,
};
