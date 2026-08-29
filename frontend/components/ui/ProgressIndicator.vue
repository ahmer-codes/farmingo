<template>
  <div class="w-full" :aria-label="`${Math.round(value)} percent`">
    <div
      v-if="showLabel"
      class="mb-1.5 flex items-center justify-between gap-2"
    >
      <span class="type-helper">{{ label }}</span>
      <span class="text-xs font-semibold tabular-nums text-ink"
        >{{ Math.round(value) }}%</span
      >
    </div>
    <div class="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
      <div
        class="h-full rounded-full transition-[width] duration-500"
        :class="barClass"
        :style="{ width: `${clamped}%` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number;
    label?: string;
    showLabel?: boolean;
    tone?: "brand" | "success" | "warning" | "danger";
  }>(),
  {
    showLabel: true,
    tone: "brand",
    label: "Progress",
  },
);

const clamped = computed(() => Math.min(100, Math.max(0, props.value)));

const barClass = computed(() => {
  const map = {
    brand: "bg-brand-600",
    success: "bg-brand-500",
    warning: "bg-amber-500",
    danger: "bg-danger",
  } as const;
  return map[props.tone];
});
</script>
