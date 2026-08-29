<template>
  <component
    :is="as"
    class="surface-card surface-shell relative"
    :class="rootClass"
  >
    <img
      :src="imageSrc"
      alt=""
      class="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover object-right opacity-[0.48] saturate-[1.05]"
      loading="lazy"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/90 via-white/80 to-white/65"
      aria-hidden="true"
    />
    <div class="relative" :class="innerClass">
      <slot />
    </div>
  </component>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    imageSrc: string;
    as?: string;
    rootClass?: string;
    innerClass?: string;
  }>(),
  {
    as: "section",
    rootClass: "",
    innerClass: "p-5",
  },
);
</script>
