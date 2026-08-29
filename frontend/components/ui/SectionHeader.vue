<template>
  <div
    class="flex items-start justify-between gap-3"
    :class="bordered ? 'border-b border-line pb-3' : ''"
  >
    <div class="min-w-0">
      <p v-if="eyebrow" class="type-label mb-1">{{ eyebrow }}</p>
      <h2 class="type-section">{{ title }}</h2>
      <p v-if="description" class="type-helper mt-1 max-w-2xl">
        {{ description }}
      </p>
    </div>
    <div v-if="$slots.action" class="shrink-0 pt-0.5">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string;
    eyebrow?: string;
    description?: string;
    bordered?: boolean;
  }>(),
  { bordered: false },
);
</script>
