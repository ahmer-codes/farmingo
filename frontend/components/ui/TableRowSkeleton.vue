<template>
  <div
    class="rounded-md border border-line bg-white p-4"
    :class="compact ? 'py-3' : ''"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1 space-y-2">
        <UiSkeleton height="sm" width="md" />
        <UiSkeleton height="xs" width="lg" />
      </div>
      <UiSkeleton
        v-if="showActions"
        height="md"
        width="xs"
        class="!w-16 shrink-0"
      />
    </div>
    <div
      v-if="showMeta"
      class="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3"
    >
      <UiSkeleton height="xs" width="sm" />
      <UiSkeleton height="xs" width="sm" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    compact?: boolean;
    showActions?: boolean;
    showMeta?: boolean;
  }>(),
  {
    compact: false,
    showActions: false,
    showMeta: false,
  },
);
</script>
