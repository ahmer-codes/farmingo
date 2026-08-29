<template>
  <component
    :is="as"
    class="surface-shell relative"
    :class="[
      variant === 'plain'
        ? 'surface-card'
        : 'rounded-md border border-brand-800/25 shadow-card',
      rootClass,
    ]"
  >
    <template v-if="variant === 'immersive'">
      <img
        :src="resolvedImageSrc"
        alt=""
        class="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover brightness-[0.52] saturate-[0.88]"
        loading="lazy"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-brand-950/78"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-950/94 via-brand-900/86 to-brand-950/80"
        aria-hidden="true"
      />
    </template>

    <div
      class="relative"
      :class="[
        innerClass,
        variant === 'immersive' ? 'weather-readable z-10' : '',
      ]"
    >
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
import { weatherHeroImage } from "~/utils/cropImages";

const props = withDefaults(
  defineProps<{
    imageSrc?: string;
    variant?: "immersive" | "plain";
    as?: string;
    rootClass?: string;
    innerClass?: string;
  }>(),
  {
    variant: "immersive",
    as: "section",
    rootClass: "",
    innerClass: "p-4",
  },
);

const resolvedImageSrc = computed(() => props.imageSrc || weatherHeroImage);
</script>

<style scoped>
.weather-readable {
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.weather-readable :deep(.type-section),
.weather-readable :deep(.type-page-title),
.weather-readable :deep(.type-card-title) {
  color: #fff;
}

.weather-readable :deep(.type-label) {
  color: rgba(255, 255, 255, 0.68);
}

.weather-readable :deep(.type-helper),
.weather-readable :deep(.type-body) {
  color: rgba(255, 255, 255, 0.82);
}

.weather-readable :deep(.text-ink) {
  color: #fff;
}

.weather-readable :deep(.text-ink-secondary) {
  color: rgba(255, 255, 255, 0.86);
}

.weather-readable :deep(.text-ink-muted) {
  color: rgba(255, 255, 255, 0.68);
}

.weather-readable :deep(.text-brand-700) {
  color: #c5d9cb;
}

.weather-readable :deep(.border-line) {
  border-color: rgba(255, 255, 255, 0.16);
}

.weather-readable :deep(.bg-canvas) {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.14);
}

.weather-readable :deep(.border-brand-200) {
  border-color: rgba(255, 255, 255, 0.2);
}

.weather-readable,
.weather-readable :deep(*) {
  scrollbar-color: rgba(255, 255, 255, 0.32) transparent;
}

.weather-readable::-webkit-scrollbar-thumb,
.weather-readable :deep(*::-webkit-scrollbar-thumb) {
  background-color: rgba(255, 255, 255, 0.32);
}

.weather-readable::-webkit-scrollbar-thumb:hover,
.weather-readable :deep(*::-webkit-scrollbar-thumb:hover) {
  background-color: rgba(255, 255, 255, 0.48);
}

.weather-readable::-webkit-scrollbar-button:single-button:horizontal:decrement,
.weather-readable
  :deep(*::-webkit-scrollbar-button:single-button:horizontal:decrement) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' fill='none' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M5.5 1.5 3 4 5.5 6.5'/%3E%3C/svg%3E");
}

.weather-readable::-webkit-scrollbar-button:single-button:horizontal:increment,
.weather-readable
  :deep(*::-webkit-scrollbar-button:single-button:horizontal:increment) {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8' fill='none' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2.5 1.5 5 4 2.5 6.5'/%3E%3C/svg%3E");
}
</style>
