<template>
  <article
    class="flex items-start gap-3 rounded-md border border-line bg-white px-3.5 py-3"
  >
    <div
      class="mt-0.5 h-2 w-2 shrink-0 rounded-full"
      :class="priorityDot"
      aria-hidden="true"
    />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-2">
        <h3 class="type-card-title">{{ task.title }}</h3>
        <UiStatusBadge :tone="statusTone">{{ statusLabel }}</UiStatusBadge>
      </div>
      <p class="type-helper mt-1">
        {{ task.cropName }} · {{ task.fieldName }}
        <span v-if="task.treatmentType"> · {{ task.treatmentType }}</span>
      </p>
      <div class="mt-2 flex flex-wrap items-center gap-3 type-helper">
        <span>Due {{ task.dueDate }}</span>
        <span class="capitalize">{{ task.priority }} priority</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FarmTask } from "~/types";

const props = defineProps<{ task: FarmTask }>();

const statusLabel = computed(() => {
  const map = {
    pending: "Pending",
    in_progress: "In progress",
    completed: "Done",
    overdue: "Overdue",
  } as const;
  return map[props.task.status];
});

const statusTone = computed(() => {
  if (props.task.status === "overdue") return "danger" as const;
  if (props.task.status === "in_progress") return "info" as const;
  if (props.task.status === "completed") return "success" as const;
  return "neutral" as const;
});

const priorityDot = computed(() => {
  if (props.task.priority === "high") return "bg-danger";
  if (props.task.priority === "medium") return "bg-amber-500";
  return "bg-brand-400";
});
</script>
