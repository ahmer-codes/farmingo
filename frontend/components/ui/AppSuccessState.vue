<template>
  <div
    class="rounded border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900"
    role="status"
  >
    <p class="font-semibold">{{ title }}</p>
    <p v-if="message" class="mt-1">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message?: string;
  }>(),
  {
    title: "Done",
  },
);
</script>
