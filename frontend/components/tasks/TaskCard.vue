<template>
  <article
    class="cursor-pointer rounded-md border bg-white px-3.5 py-3 transition-colors hover:bg-canvas/70"
    :class="task.status === 'overdue' ? 'border-danger/30' : 'border-line'"
    @click="$emit('select', task)"
  >
    <div class="flex items-start gap-3">
      <div
        class="mt-1 h-2 w-2 shrink-0 rounded-full"
        :class="priorityDot"
        aria-hidden="true"
      />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="type-card-title">{{ task.title }}</h3>
          <UiStatusBadge :tone="statusTone">{{ statusLabel }}</UiStatusBadge>
          <UiStatusBadge tone="neutral">{{ sourceLabel }}</UiStatusBadge>
        </div>
        <p class="type-helper mt-1 line-clamp-2">{{ task.description }}</p>
        <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1 type-helper">
          <span>{{ task.crop }} · {{ task.field }}</span>
          <span>{{ formatDue(task.dueDate, task.dueTime) }}</span>
          <span>{{ task.estimatedDurationMinutes }} min</span>
          <span class="capitalize">{{ task.priority }} priority</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { WorkTask } from "~/types";
import { TASK_SOURCE_LABELS, TASK_STATUS_LABELS } from "~/types";

const props = defineProps<{ task: WorkTask }>();
defineEmits<{ select: [task: WorkTask] }>();

const statusLabel = computed(() => TASK_STATUS_LABELS[props.task.status]);
const sourceLabel = computed(() => TASK_SOURCE_LABELS[props.task.source]);

const statusTone = computed(() => {
  if (props.task.status === "overdue") return "danger" as const;
  if (props.task.status === "in_progress") return "info" as const;
  if (props.task.status === "completed") return "success" as const;
  if (props.task.status === "skipped") return "neutral" as const;
  return "warning" as const;
});

const priorityDot = computed(() => {
  if (props.task.priority === "high") return "bg-danger";
  if (props.task.priority === "medium") return "bg-amber-500";
  return "bg-brand-400";
});

function formatDue(date: string, time: string) {
  const d = new Date(`${date}T${time}:00`);
  if (Number.isNaN(d.getTime())) return `${date} ${time}`;
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>
