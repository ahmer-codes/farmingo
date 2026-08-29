<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-sm font-semibold uppercase tracking-wide"
    :class="[
      toneClass,
      compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]',
    ]"
  >
    <span
      v-if="dot"
      class="h-1.5 w-1.5 rounded-full bg-current opacity-80"
      aria-hidden="true"
    />
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "info";
    dot?: boolean;
    compact?: boolean;
  }>(),
  { tone: "neutral", dot: false, compact: false },
);

const toneClass = computed(() => {
  const map = {
    neutral: "bg-surface-muted text-ink-secondary",
    success: "bg-brand-100 text-brand-700",
    warning: "bg-amber-100 text-amber-700",
    danger: "bg-danger-soft text-danger",
    brand: "bg-brand-600 text-white",
    info: "bg-brand-50 text-brand-600",
  } as const;
  return map[props.tone];
});
</script>
