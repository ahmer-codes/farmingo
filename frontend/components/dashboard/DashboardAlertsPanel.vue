<template>
  <section class="surface-card p-4">
    <UiSectionHeader
      title="Alerts"
      description="Items that need attention, separate from routine notifications."
    >
      <template #action>
        <NuxtLink
          to="/notifications"
          class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          Inbox
        </NuxtLink>
      </template>
    </UiSectionHeader>

    <div v-if="alerts.length" class="mt-4 space-y-2">
      <FarmAlertCard
        v-for="alert in prioritized"
        :key="alert.id"
        :alert="alert"
      />
    </div>
    <UiEmptyState
      v-else
      class="mt-4"
      title="No open alerts"
      description="Critical and warning alerts will appear here when risks are detected."
    />
  </section>
</template>

<script setup lang="ts">
import type { FarmAlert } from "~/types";

const props = defineProps<{ alerts: FarmAlert[] }>();

const rank = { critical: 0, warning: 1, info: 2 } as const;

const prioritized = computed(() =>
  [...props.alerts].sort((a, b) => rank[a.severity] - rank[b.severity]),
);
</script>
