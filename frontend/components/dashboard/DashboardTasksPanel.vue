<template>
  <section class="surface-card p-4">
    <UiSectionHeader
      title="Field tasks"
      description="What needs doing today, what’s overdue, and what’s next."
    >
      <template #action>
        <NuxtLink
          to="/tasks"
          class="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Manage
        </NuxtLink>
      </template>
    </UiSectionHeader>

    <div class="mt-4">
      <div class="mb-2 flex items-center justify-between gap-2">
        <p class="type-helper">Week progress</p>
        <p class="text-xs font-semibold tabular-nums text-ink">
          {{ tasks.completedThisWeek }}/{{ tasks.totalThisWeek }} done
        </p>
      </div>
      <UiProgressIndicator
        :value="progressPercent"
        :show-label="false"
        tone="brand"
      />
    </div>

    <div class="mt-5 space-y-4">
      <div v-if="tasks.overdue.length">
        <p class="type-label mb-2 text-danger">Overdue</p>
        <div class="space-y-2">
          <FarmTaskCard
            v-for="task in tasks.overdue"
            :key="task.id"
            :task="task"
          />
        </div>
      </div>

      <div>
        <p class="type-label mb-2">Today</p>
        <div v-if="tasks.today.length" class="space-y-2">
          <FarmTaskCard
            v-for="task in tasks.today"
            :key="task.id"
            :task="task"
          />
        </div>
        <p v-else class="type-helper rounded-md bg-canvas px-3 py-2">
          No tasks due today.
          <NuxtLink
            to="/tasks"
            class="ml-1.5 inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-line bg-white px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:bg-canvas"
          >
            Create task
          </NuxtLink>
        </p>
      </div>

      <div>
        <p class="type-label mb-2">Upcoming</p>
        <div v-if="tasks.upcoming.length" class="space-y-2">
          <FarmTaskCard
            v-for="task in tasks.upcoming"
            :key="task.id"
            :task="task"
          />
        </div>
        <p v-else class="type-helper rounded-md bg-canvas px-3 py-2">
          Nothing scheduled next.
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { TaskSummary } from "~/types";

const props = defineProps<{ tasks: TaskSummary }>();

const progressPercent = computed(() => {
  if (!props.tasks.totalThisWeek) return 0;
  return Math.round(
    (props.tasks.completedThisWeek / props.tasks.totalThisWeek) * 100,
  );
});
</script>
