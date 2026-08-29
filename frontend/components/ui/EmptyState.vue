<template>
  <div
    class="flex flex-col items-center gap-3 rounded-md border border-dashed border-line bg-surface-muted/60 px-5 py-8 text-center sm:items-start sm:text-left"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      class="h-24 w-24 rounded-md object-cover"
      loading="lazy"
    />
    <div>
      <p class="type-card-title">{{ title }}</p>
      <p class="type-body mt-1 max-w-md">{{ description }}</p>
    </div>
    <div v-if="$slots.action" class="mt-1">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    imageSrc?: string;
  }>(),
  {
    title: "Nothing to show yet",
    description:
      "When records are available for this farm section, they will appear here.",
    imageSrc: undefined,
  },
);
</script>
