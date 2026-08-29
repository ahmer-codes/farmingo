<template>
  <article class="surface-card min-w-0 p-4">
    <p class="type-label">{{ label }}</p>
    <div class="mt-2 flex min-w-0 items-baseline gap-1.5">
      <p
        class="min-w-0 font-semibold tracking-tight text-ink"
        :class="
          valueSize === 'text'
            ? 'break-words text-base leading-snug sm:text-lg'
            : 'type-metric'
        "
      >
        {{ value }}
      </p>
      <span v-if="unit" class="shrink-0 text-sm font-medium text-ink-muted">{{
        unit
      }}</span>
    </div>
    <p v-if="helper" class="type-helper mt-1 break-words">{{ helper }}</p>
    <p v-if="delta" class="mt-2 text-xs font-medium" :class="deltaClass">
      {{ delta }}
    </p>
  </article>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    label: string;
    value: string;
    unit?: string;
    helper?: string;
    delta?: string;
    deltaTone?: "positive" | "negative" | "neutral";
    /** Use "text" for long non-numeric values (crop/location names). */
    valueSize?: "metric" | "text";
  }>(),
  {
    valueSize: "metric",
  },
);

const deltaClass = computed(() => {
  if (props.deltaTone === "positive") return "text-brand-600";
  if (props.deltaTone === "negative") return "text-danger";
  return "text-ink-muted";
});
</script>
