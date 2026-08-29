<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
    role="status"
  >
    <div
      class="h-9 w-9 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
      aria-hidden="true"
    />
    <p class="type-body font-medium text-ink">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: "Loading farm data…",
});
</script>
