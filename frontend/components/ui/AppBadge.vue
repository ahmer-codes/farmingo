<template>
  <span
    class="inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold"
    :class="toneClass"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    tone?: "neutral" | "success" | "warning" | "danger" | "brand";
  }>(),
  { tone: "neutral" },
);

const toneClass = computed(() => {
  const map = {
    neutral: "bg-soil-100 text-soil-700",
    success: "bg-brand-100 text-brand-800",
    warning: "bg-accent-100 text-accent-800",
    danger: "bg-red-100 text-red-800",
    brand: "bg-brand-600 text-white",
  } as const;
  return map[props.tone];
});
</script>
