<template>
  <section class="surface-card p-4">
    <UiSectionHeader
      title="Today's farm alerts"
      description="Proactive recommendations from weather conditions and your crop context."
    />

    <ul v-if="actions.length" class="mt-4 space-y-3">
      <li
        v-for="action in actions"
        :key="action.id"
        class="rounded-md border px-3.5 py-3.5"
        :class="urgencyShell(action.urgency)"
      >
        <div class="flex flex-wrap items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-lg leading-none" aria-hidden="true">{{
                severityIcon(action.urgency)
              }}</span>
              <UiStatusBadge :tone="urgencyTone(action.urgency)">
                {{ timingLabel(action) }}
              </UiStatusBadge>
              <h3 class="type-card-title">{{ action.title }}</h3>
            </div>

            <p
              v-if="action.cropName || action.fieldName"
              class="type-helper mt-1.5"
            >
              <span v-if="action.cropName">{{ action.cropName }}</span>
              <span v-if="action.cropName && action.fieldName">, </span>
              <span v-if="action.fieldName">{{ action.fieldName }}</span>
            </p>

            <p class="type-body mt-2">
              {{ action.drivers.cropContext || action.drivers.weatherSignal }}
            </p>

            <div class="mt-3 rounded-md bg-white/70 px-3 py-2.5">
              <p class="type-label">Recommended</p>
              <p class="mt-1 text-sm text-ink">{{ action.detail }}</p>
            </div>
          </div>
        </div>

        <div
          v-if="action.fieldId || action.cropId"
          class="mt-3 flex flex-wrap gap-2 border-t border-line/60 pt-3"
        >
          <NuxtLink
            v-if="action.fieldId"
            :to="`/farm?field=${action.fieldId}`"
            class="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            View field →
          </NuxtLink>
          <NuxtLink
            v-if="action.cropId"
            :to="`/crops?edit=${action.cropId}`"
            class="text-sm font-medium text-brand-700 hover:text-brand-800"
          >
            Inspect crop →
          </NuxtLink>
        </div>
      </li>
    </ul>

    <UiEmptyState
      v-else
      class="mt-4"
      title="No alerts right now"
      description="When weather conditions may affect your crops, actionable recommendations will appear here."
    />
  </section>
</template>

<script setup lang="ts">
import type { RecommendedAction } from "~/types";

defineProps<{ actions: RecommendedAction[] }>();

function timingLabel(action: RecommendedAction) {
  if (action.timing) return action.timing;
  if (action.urgency === "now") return "Do now";
  if (action.urgency === "today") return "Today";
  return "Soon";
}

function severityIcon(urgency: RecommendedAction["urgency"]) {
  if (urgency === "now") return "⚠";
  if (urgency === "today") return "🌧";
  return "ℹ";
}

function urgencyTone(urgency: RecommendedAction["urgency"]) {
  if (urgency === "now") return "danger" as const;
  if (urgency === "today") return "warning" as const;
  return "info" as const;
}

function urgencyShell(urgency: RecommendedAction["urgency"]) {
  if (urgency === "now") return "border-danger/25 bg-danger-soft/30";
  if (urgency === "today") return "border-amber-200 bg-amber-50/40";
  return "border-line bg-white";
}
</script>
