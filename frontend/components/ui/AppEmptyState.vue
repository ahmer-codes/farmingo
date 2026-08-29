<template>
  <div
    class="flex flex-col items-start gap-2 rounded border border-dashed border-soil-300 bg-soil-50 px-5 py-8"
  >
    <p class="text-sm font-semibold text-soil-800">{{ title }}</p>
    <p class="max-w-md text-sm text-soil-600">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: "Nothing here yet",
    description: "When data is available, it will appear in this section.",
  },
);
</script>
