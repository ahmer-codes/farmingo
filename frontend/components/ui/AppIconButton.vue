<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :aria-label="ariaLabel"
    :title="title || ariaLabel"
    class="inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
    :class="[
      sizeClass,
      variantClass,
      { 'active:brightness-95': !disabled && !loading },
    ]"
    @click="$emit('click', $event)"
  >
    <span
      v-if="loading"
      class="animate-spin rounded-full border-2 border-current border-r-transparent"
      :class="iconSizeClass"
      aria-hidden="true"
    />
    <UiAppIcon v-else :name="icon" :size="iconSize" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon: string;
    ariaLabel: string;
    title?: string;
    variant?: "default" | "ghost" | "destructive";
    size?: "md" | "lg";
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
  }>(),
  {
    variant: "ghost",
    size: "lg",
    type: "button",
    disabled: false,
    loading: false,
  },
);

defineEmits<{ click: [event: MouseEvent] }>();

const sizeClass = computed(() =>
  props.size === "lg" ? "min-h-11 min-w-11 p-2" : "min-h-9 min-w-9 p-1.5",
);

const iconSize = computed(() => (props.size === "lg" ? "md" : "sm"));

const iconSizeClass = computed(() =>
  props.size === "lg" ? "h-[1.125rem] w-[1.125rem]" : "h-4 w-4",
);

const variantClass = computed(() => {
  const map = {
    default:
      "border border-line bg-white text-ink-secondary hover:bg-canvas hover:text-ink",
    ghost: "text-ink-secondary hover:bg-surface-muted hover:text-ink",
    destructive: "text-danger hover:bg-danger-soft",
  } as const;
  return map[props.variant];
});
</script>
