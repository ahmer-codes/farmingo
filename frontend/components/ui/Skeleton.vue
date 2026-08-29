<template>
  <div
    class="animate-pulse rounded-md bg-surface-muted"
    :class="[heightClass, widthClass, props.class]"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    height?: "xs" | "sm" | "md" | "lg" | "xl" | "full";
    width?: "xs" | "sm" | "md" | "lg" | "full" | "auto";
    class?: string;
  }>(),
  {
    height: "md",
    width: "full",
  },
);

const heightClass = computed(() => {
  const map = {
    xs: "h-3",
    sm: "h-4",
    md: "h-5",
    lg: "h-8",
    xl: "h-12",
    full: "h-full",
  } as const;
  return map[props.height];
});

const widthClass = computed(() => {
  const map = {
    xs: "w-12",
    sm: "w-20",
    md: "w-32",
    lg: "w-48",
    full: "w-full",
    auto: "w-auto",
  } as const;
  return map[props.width];
});
</script>
