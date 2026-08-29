<template>
  <article class="surface-card min-w-0 overflow-hidden p-4">
    <UiSkeleton height="sm" width="md" />
    <UiSkeleton class="mt-2" height="xs" width="lg" />
    <UiSkeleton class="mt-4 w-full" :height="tall ? 'xl' : 'lg'" />
  </article>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ tall?: boolean }>(), { tall: false });
</script>
