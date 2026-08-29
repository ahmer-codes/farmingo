<template>
  <div
    class="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center"
  >
    <div
      class="h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
    />
    <p class="text-sm font-medium text-soil-700">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ message?: string }>(), {
  message: "Loading…",
});
</script>
