<template>
  <div
    class="rounded-md border border-danger/30 bg-danger-soft px-4 py-3"
    role="alert"
  >
    <p class="text-sm font-semibold text-danger">{{ title }}</p>
    <p class="mt-1 text-sm text-ink-secondary">{{ message }}</p>
    <button
      v-if="retryLabel"
      type="button"
      class="mt-3 text-sm font-semibold text-danger underline underline-offset-2"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    message: string;
    retryLabel?: string;
  }>(),
  { title: "Unable to load data" },
);

defineEmits<{ retry: [] }>();
</script>
