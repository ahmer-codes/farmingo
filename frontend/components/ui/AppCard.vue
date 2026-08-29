<template>
  <section
    class="rounded border border-soil-200 bg-white shadow-panel"
    :class="padded ? 'p-4 sm:p-5' : ''"
  >
    <header
      v-if="title || $slots.actions"
      class="mb-4 flex gap-3"
      :class="
        $slots.actions
          ? 'flex-col sm:flex-row sm:items-start sm:justify-between'
          : 'items-start justify-between'
      "
    >
      <div class="min-w-0 flex-1">
        <p v-if="eyebrow" class="type-label mb-1">{{ eyebrow }}</p>
        <h2
          v-if="title"
          class="break-words text-base font-semibold text-soil-900"
        >
          {{ title }}
        </h2>
        <p v-if="description" class="mt-1 break-words text-sm text-soil-600">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="shrink-0 sm:pt-0.5">
        <slot name="actions" />
      </div>
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    eyebrow?: string;
    description?: string;
    padded?: boolean;
  }>(),
  {
    padded: true,
  },
);
</script>
