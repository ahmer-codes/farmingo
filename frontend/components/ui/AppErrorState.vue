<template>
  <div
    class="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
    role="alert"
  >
    <p class="font-semibold">{{ title }}</p>
    <p class="mt-1">{{ message }}</p>
    <button
      v-if="retryLabel"
      type="button"
      class="mt-3 text-sm font-semibold underline underline-offset-2"
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
  {
    title: "Something went wrong",
  },
);

defineEmits<{ retry: [] }>();
</script>
