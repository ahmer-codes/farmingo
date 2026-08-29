import type { FarmTask, TaskSummary } from "~/types/dashboard";
import type { WorkTask } from "~/types/task";

/** UTC calendar date, matches backend `todayIsoDate()`. */
export function todayIsoDate(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function isOpenTask(task: WorkTask): boolean {
  return task.status !== "completed" && task.status !== "skipped";
}

export function isTaskDueToday(
  task: WorkTask,
  today = todayIsoDate(),
): boolean {
  return isOpenTask(task) && task.dueDate === today;
}

export function isTaskUpcoming(
  task: WorkTask,
  today = todayIsoDate(),
): boolean {
  return isOpenTask(task) && task.dueDate > today;
}

export function isTaskOverdue(task: WorkTask, today = todayIsoDate()): boolean {
  if (!isOpenTask(task)) return false;
  return task.status === "overdue" || task.dueDate < today;
}

export function dueGroup(
  task: WorkTask,
  today = todayIsoDate(),
): FarmTask["dueGroup"] {
  if (isTaskOverdue(task, today)) return "overdue";
  if (task.dueDate === today) return "today";
  return "upcoming";
}

export function mapTaskToFarmTask(
  task: WorkTask,
  today = todayIsoDate(),
): FarmTask {
  return {
    id: task.id,
    title: task.title,
    cropName: task.crop,
    fieldName: task.field,
    dueDate: task.dueDate,
    dueGroup: dueGroup(task, today),
    priority:
      task.priority === "high" ||
      task.priority === "medium" ||
      task.priority === "low"
        ? task.priority
        : "medium",
    status:
      task.status === "overdue" ||
      task.status === "pending" ||
      task.status === "in_progress" ||
      task.status === "completed"
        ? task.status
        : "pending",
    treatmentType: task.relatedDisease || undefined,
  };
}

function getWeekBounds(today: string): { weekStart: string; weekEnd: string } {
  const anchor = new Date(`${today}T12:00:00.000Z`);
  const start = new Date(anchor);
  start.setUTCDate(anchor.getUTCDate() - anchor.getUTCDay());
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    weekStart: start.toISOString().slice(0, 10),
    weekEnd: end.toISOString().slice(0, 10),
  };
}

/** Dashboard field-tasks panel, same buckets as the Tasks page. */
export function buildTaskSummary(
  tasks: WorkTask[],
  today = todayIsoDate(),
): TaskSummary {
  const open = tasks.filter(isOpenTask).map((t) => mapTaskToFarmTask(t, today));

  const { weekStart, weekEnd } = getWeekBounds(today);
  const weekTasks = tasks.filter(
    (t) =>
      t.status !== "skipped" && t.dueDate >= weekStart && t.dueDate <= weekEnd,
  );

  return {
    overdue: open.filter((t) => t.dueGroup === "overdue").slice(0, 4),
    today: open.filter((t) => t.dueGroup === "today").slice(0, 4),
    upcoming: open.filter((t) => t.dueGroup === "upcoming").slice(0, 4),
    completedThisWeek: weekTasks.filter((t) => t.status === "completed").length,
    totalThisWeek: weekTasks.length,
  };
}

export function countOpenTasks(
  tasks: WorkTask[],
  today = todayIsoDate(),
): number {
  return tasks.filter(
    (t) =>
      isTaskDueToday(t, today) ||
      isTaskUpcoming(t, today) ||
      isTaskOverdue(t, today),
  ).length;
}

export function countCompletedTasks(tasks: WorkTask[]): number {
  return tasks.filter((t) => t.status === "completed").length;
}

export function filterTodayTasks(
  tasks: WorkTask[],
  today = todayIsoDate(),
): WorkTask[] {
  return tasks.filter((t) => isTaskDueToday(t, today));
}

export function filterUpcomingTasks(
  tasks: WorkTask[],
  today = todayIsoDate(),
): WorkTask[] {
  return tasks.filter((t) => isTaskUpcoming(t, today));
}

export function filterOverdueTasks(
  tasks: WorkTask[],
  today = todayIsoDate(),
): WorkTask[] {
  return tasks.filter((t) => isTaskOverdue(t, today));
}
