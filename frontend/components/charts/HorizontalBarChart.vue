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
      <div v-for="item in normalizedItems" :key="item.label" class="space-y-1">
        <div class="flex items-center justify-between gap-2 text-sm">
          <span class="truncate font-medium text-ink" :title="item.label">{{
            item.label
          }}</span>
          <span class="shrink-0 tabular-nums text-ink-secondary">
            {{ formatValue(item) }}
          </span>
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-surface-muted">
          <div
            class="h-full min-w-[2px] rounded-full bg-brand-600 transition-all duration-500"
            :style="{ width: `${item.percent}%` }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items: Array<{ label: string; value: number }>;
    title?: string;
    description?: string;
    emptyMessage?: string;
    valueSuffix?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Distribution",
    description: "",
    emptyMessage: "Not enough data yet.",
    valueSuffix: "",
    embedded: false,
  },
);

const maxValue = computed(() =>
  Math.max(...props.items.map((i) => i.value), 1),
);

const normalizedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    percent: Math.max(4, (item.value / maxValue.value) * 100),
  })),
);

function formatValue(item: { label: string; value: number }) {
  if (props.valueSuffix === "%") {
    return `${item.value}%`;
  }
  return `${item.value}${props.valueSuffix ? ` ${props.valueSuffix}` : ""}`;
}
</script>
