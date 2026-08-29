<template>
  <article class="rounded-md border px-3.5 py-3" :class="shellClass">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <UiStatusBadge :tone="badgeTone" dot>{{
            severityLabel
          }}</UiStatusBadge>
          <span class="type-helper capitalize">{{ alert.source }}</span>
        </div>
        <h3 class="type-card-title mt-2">{{ alert.title }}</h3>
        <p class="type-body mt-1">{{ alert.message }}</p>
      </div>
      <time class="shrink-0 type-helper whitespace-nowrap">{{
        alert.createdAt
      }}</time>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FarmAlert } from "~/types";

const props = defineProps<{ alert: FarmAlert }>();

const severityLabel = computed(() => {
  if (props.alert.severity === "critical") return "Critical";
  if (props.alert.severity === "warning") return "Watch";
  return "Info";
});

const badgeTone = computed(() => {
  if (props.alert.severity === "critical") return "danger" as const;
  if (props.alert.severity === "warning") return "warning" as const;
  return "info" as const;
});

const shellClass = computed(() => {
  if (props.alert.severity === "critical")
    return "border-danger/25 bg-danger-soft/40";
  if (props.alert.severity === "warning")
    return "border-amber-200 bg-amber-50/50";
  return "border-line bg-white";
});
</script>
