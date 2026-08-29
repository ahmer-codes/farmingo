<template>
  <div
    class="inline-flex items-center gap-1 text-brand-600"
    :class="size === 'sm' ? 'text-brand-600' : ''"
    role="status"
    :aria-label="label"
  >
    <span
      v-for="n in 3"
      :key="n"
      class="animate-bounce rounded-full bg-current"
      :class="size === 'sm' ? 'h-1 w-1' : 'h-1.5 w-1.5'"
      :style="{ animationDelay: `${(n - 1) * 150}ms` }"
      aria-hidden="true"
    />
    <span v-if="showLabel" class="sr-only">{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: "sm" | "md";
    label?: string;
    showLabel?: boolean;
  }>(),
  {
    size: "md",
    label: "Loading",
    showLabel: false,
  },
);
</script>
