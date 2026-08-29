<template>
  <header
    class="page-hero surface-shell relative rounded-md border border-brand-800/25 shadow-card"
  >
    <img
      :src="imageSrc"
      alt=""
      class="absolute inset-0 h-full w-full scale-[1.02] object-cover brightness-[0.48] saturate-[0.88]"
      loading="lazy"
    />
    <div class="absolute inset-0 bg-brand-950/85" aria-hidden="true" />
    <div
      class="absolute inset-0 bg-gradient-to-r from-brand-950/98 via-brand-900/92 to-brand-950/70 sm:to-brand-950/55"
      aria-hidden="true"
    />

    <div
      class="relative z-10 flex flex-wrap items-end justify-between gap-4 px-5 py-6 sm:px-6 sm:py-8"
    >
      <div class="min-w-0 max-w-3xl">
        <p v-if="eyebrow" class="page-hero__eyebrow">
          {{ eyebrow }}
        </p>
        <h2 class="page-hero__title" :class="eyebrow ? 'mt-1' : ''">
          {{ title }}
        </h2>
        <p v-if="description" class="page-hero__description">
          {{ description }}
        </p>
      </div>
      <div v-if="$slots.actions" class="page-hero__actions shrink-0">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  imageSrc: string;
  title: string;
  eyebrow?: string;
  description?: string;
}>();
</script>

<style scoped>
.page-hero__eyebrow {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

.page-hero__title {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.25;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
}

@media (min-width: 768px) {
  .page-hero__title {
    font-size: 1.75rem;
  }
}

.page-hero__description {
  margin-top: 0.5rem;
  max-width: 42rem;
  font-size: 0.875rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
}

@media (min-width: 640px) {
  .page-hero__description {
    font-size: 0.9375rem;
  }
}

.page-hero__actions :deep(a) {
  color: #e8f0ea;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.page-hero__actions :deep(a:hover) {
  color: #fff;
}
</style>
