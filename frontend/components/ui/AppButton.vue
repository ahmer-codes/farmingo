<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex shrink-0 flex-nowrap items-center justify-center gap-1.5 whitespace-nowrap rounded-md font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      sizeClass,
      variantClass,
      { 'active:brightness-95': !disabled && !loading },
    ]"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: "primary" | "secondary" | "ghost" | "accent" | "destructive";
    size?: "sm" | "md";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: "primary",
    size: "md",
    type: "button",
    disabled: false,
    loading: false,
  },
);

defineEmits<{ click: [event: MouseEvent] }>();

const sizeClass = computed(() =>
  props.size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
);

const variantClass = computed(() => {
  const map = {
    primary: "bg-brand-600 text-white hover:bg-brand-700",
    secondary: "border border-line bg-white text-ink hover:bg-canvas",
    ghost: "text-ink-secondary hover:bg-surface-muted",
    accent: "bg-amber-500 text-white hover:bg-amber-600",
    destructive: "bg-danger text-white hover:bg-danger/90",
  } as const;
  return map[props.variant];
});
</script>
