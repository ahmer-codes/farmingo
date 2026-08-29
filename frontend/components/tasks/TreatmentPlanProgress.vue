<template>
  <section v-if="plan" class="surface-card p-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="type-label">Treatment plan</p>
        <h3 class="type-section mt-1">{{ plan.title }}</h3>
        <p class="type-helper mt-1">
          {{ plan.cropName }} · {{ plan.problemName }}
        </p>
      </div>
      <p class="text-sm font-semibold tabular-nums text-ink">
        {{ plan.progress.completed }} / {{ plan.progress.total }} tasks
        completed
      </p>
    </div>
    <div class="mt-3">
      <UiProgressIndicator :value="percent" :show-label="false" tone="brand" />
    </div>
    <ul class="mt-4 space-y-2">
      <li
        v-for="task in plan.tasks"
        :key="task.id"
        class="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm"
      >
        <div>
          <p class="font-medium text-ink">
            <span v-if="task.dayOffset !== undefined"
              >Day {{ task.dayOffset + 1 }} ·
            </span>
            {{ task.title }}
          </p>
          <p class="type-helper">Due {{ task.dueDate }} {{ task.dueTime }}</p>
        </div>
        <UiStatusBadge
          :tone="
            task.status === 'completed'
              ? 'success'
              : task.status === 'overdue'
                ? 'danger'
                : 'neutral'
          "
        >
          {{ task.status.replace("_", " ") }}
        </UiStatusBadge>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import type { TreatmentPlan } from "~/types";

const props = defineProps<{ plan: TreatmentPlan | null }>();

const percent = computed(() => {
  if (!props.plan?.progress.total) return 0;
  return Math.round(
    (props.plan.progress.completed / props.plan.progress.total) * 100,
  );
});
</script>
