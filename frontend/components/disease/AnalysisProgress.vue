<template>
  <DiseaseSectionShell
    :image-src="diseaseSectionImages.analysisStep"
    inner-class="px-5 py-10 text-center"
  >
    <div
      class="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
    />
    <p class="mt-4 text-base font-semibold text-ink">{{ currentMessage }}</p>
    <p class="type-helper mx-auto mt-2 max-w-md">
      AI-assisted assessment comparing your crop and symptoms against known
      field patterns. This is decision support, not a lab diagnosis.
    </p>
    <ol
      class="mx-auto mt-6 max-w-sm space-y-2 text-left text-sm text-ink-secondary"
    >
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="flex items-center gap-2"
        :class="
          index <= activeIndex ? 'text-ink font-medium' : 'text-ink-muted'
        "
      >
        <span
          class="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
          :class="
            index < activeIndex
              ? 'bg-brand-600 text-white'
              : index === activeIndex
                ? 'bg-brand-100 text-brand-700'
                : 'bg-surface-muted text-ink-muted'
          "
        >
          {{ index < activeIndex ? "✓" : index + 1 }}
        </span>
        {{ step }}
      </li>
    </ol>
  </DiseaseSectionShell>
</template>

<script setup lang="ts">
import { diseaseSectionImages } from "~/utils/cropImages";

const props = withDefaults(defineProps<{ uploading?: boolean }>(), {
  uploading: false,
});

const steps = computed(() =>
  props.uploading
    ? [
        "Uploading crop image…",
        "Analyzing crop image metadata…",
        "Comparing selected symptoms…",
        "Preparing crop health assessment…",
      ]
    : [
        "Analyzing crop image metadata…",
        "Comparing selected symptoms…",
        "Preparing crop health assessment…",
      ],
);

const activeIndex = ref(0);
const currentMessage = computed(
  () => steps.value[activeIndex.value] || steps.value[0],
);

let timer: ReturnType<typeof setInterval> | undefined;

onMounted(() => {
  timer = setInterval(() => {
    if (activeIndex.value < steps.value.length - 1) activeIndex.value += 1;
  }, 900);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>
