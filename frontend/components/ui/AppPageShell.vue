<template>
  <div class="surface-card p-6">
    <UiStatusBadge tone="brand">Coming next</UiStatusBadge>
    <h1 class="type-page-title mt-3">{{ title }}</h1>
    <p class="type-body mt-2 max-w-2xl">{{ description }}</p>
    <ul v-if="bullets?.length" class="mt-5 space-y-2 border-t border-line pt-4">
      <li
        v-for="item in bullets"
        :key="item"
        class="flex items-start gap-2 text-sm text-ink-secondary"
      >
        <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
        <span>{{ item }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description: string;
  bullets?: string[];
}>();
</script>
