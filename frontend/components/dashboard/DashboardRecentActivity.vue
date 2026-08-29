<template>
  <section class="surface-card p-4">
    <UiSectionHeader
      title="Recent activity"
      description="Latest actions across your farm workspace."
    />

    <ul v-if="items.length" class="mt-4 divide-y divide-line">
      <li
        v-for="item in items"
        :key="item.id"
        class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
      >
        <span
          class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase"
          :class="typeClass(item.type)"
        >
          {{ typeInitial(item.type) }}
        </span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <h3 class="type-card-title">{{ item.title }}</h3>
            <time class="type-helper whitespace-nowrap">{{
              item.createdAt
            }}</time>
          </div>
          <p class="type-body mt-1">{{ item.detail }}</p>
        </div>
      </li>
    </ul>

    <UiEmptyState
      v-else
      class="mt-4"
      title="No recent activity"
      description="Assessments, completed tasks, and alerts will show up here."
    />
  </section>
</template>

<script setup lang="ts">
import type { ActivityItem, ActivityType } from "~/types";

defineProps<{ items: ActivityItem[] }>();

function typeInitial(type: ActivityType) {
  const map: Record<ActivityType, string> = {
    crop_added: "CR",
    disease_assessment: "DA",
    task_completed: "TK",
    weather_alert: "WX",
    profile_updated: "PR",
    yield_logged: "YL",
  };
  return map[type];
}

function typeClass(type: ActivityType) {
  if (type === "weather_alert") return "bg-amber-100 text-amber-800";
  if (type === "disease_assessment") return "bg-brand-100 text-brand-800";
  if (type === "task_completed") return "bg-brand-600 text-white";
  return "bg-surface-muted text-ink-secondary";
}
</script>
