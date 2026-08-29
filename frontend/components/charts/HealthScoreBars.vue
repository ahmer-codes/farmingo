<template>
  <div :class="embedded ? '' : 'surface-card p-4 sm:p-5'">
    <UiSectionHeader
      v-if="!embedded"
      :title="title"
      :description="description"
    />

    <ChartsChartEmptyState
      v-if="!items.length"
      class="mt-4"
      :message="emptyMessage"
    />

    <div v-else class="mt-4 space-y-3">
      <div v-for="item in items" :key="item.label" class="space-y-1">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="truncate font-medium text-ink">{{ item.label }}</span>
          <span class="shrink-0 tabular-nums text-ink-secondary">
            {{ item.score }}%
          </span>
        </div>
        <div class="h-2 overflow-hidden rounded-full bg-surface-muted">
          <div
            class="h-full min-w-[2px] rounded-full transition-all duration-500"
            :class="barTone(item.score)"
            :style="{ width: `${normalizedScore(item.score)}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    items: Array<{ label: string; score: number }>;
    title?: string;
    description?: string;
    emptyMessage?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Health score by crop",
    description: "Based on your recorded crop health scores.",
    emptyMessage: "Add crops to see health scores.",
    embedded: false,
  },
);

function normalizedScore(score: number) {
  return Math.min(100, Math.max(0, Number(score) || 0));
}

function barTone(score: number) {
  const value = normalizedScore(score);
  if (value >= 80) return "bg-brand-500";
  if (value >= 65) return "bg-amber-500";
  return "bg-danger";
}
</script>
