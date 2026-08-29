<template>
  <div class="surface-card p-4">
    <p class="type-label">{{ label }}</p>
    <p class="mt-2 text-2xl font-semibold tabular-nums text-ink">{{ value }}</p>
    <p v-if="helper" class="type-helper mt-1">{{ helper }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{ label: string; value: string | number; helper?: string }>();
</script>
