<template>
  <div
    class="flex flex-col items-center justify-center rounded-md border border-dashed border-line bg-canvas/40 px-4 py-10 text-center"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt=""
      class="mb-4 h-24 w-24 rounded-full object-cover opacity-90"
      loading="lazy"
    />
    <p class="text-sm font-semibold text-ink">{{ message }}</p>
    <p v-if="hint" class="type-helper mt-1 max-w-xs">{{ hint }}</p>
  </div>
</template>

<script setup lang="ts">
import { emptyCropImage } from "~/utils/cropImages";

withDefaults(
  defineProps<{
    message?: string;
    hint?: string;
    imageSrc?: string;
  }>(),
  {
    message: "No data yet",
    hint: "",
    imageSrc: emptyCropImage,
  },
);
</script>
