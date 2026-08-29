<template>
  <section class="surface-card w-full p-4">
    <div
      class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
    >
      <div class="min-w-0 shrink lg:flex-1">
        <UiSectionHeader
          title="Yield overview"
          description="Expected vs actual production from your crop and yield records."
        />
      </div>
      <div
        class="flex shrink-0 flex-nowrap items-center gap-2 overflow-x-auto pb-0.5"
      >
        <select v-model="crop" class="yield-filter-select" aria-label="Crop">
          <option v-for="option in cropOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <select
          v-model="season"
          class="yield-filter-select"
          aria-label="Season"
        >
          <option v-for="option in seasonOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
        <select
          v-model.number="year"
          class="yield-filter-select"
          aria-label="Year"
        >
          <option v-for="option in yearOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="activeSeries" class="mt-3">
      <FarmYieldTrendChart :points="activeSeries.points" embedded compact />
    </div>
    <UiEmptyState
      v-else
      class="mt-4"
      title="No yield series for this filter"
      description="Try another crop, season, or year."
    />
  </section>
</template>

<script setup lang="ts">
import type { YieldSeries } from "~/types";

const props = defineProps<{ series: YieldSeries[] }>();

const cropOptions = computed(() => [
  ...new Set(props.series.map((s) => s.crop)),
]);
const seasonOptions = computed(() => {
  const forCrop = props.series.filter((s) => s.crop === crop.value);
  return [...new Set(forCrop.map((s) => s.season))];
});
const yearOptions = computed(() => {
  const filtered = props.series.filter(
    (s) => s.crop === crop.value && s.season === season.value,
  );
  return [...new Set(filtered.map((s) => s.year))].sort((a, b) => b - a);
});

const crop = ref("");
const season = ref("");
const year = ref(0);

watch(
  () => props.series,
  (list) => {
    if (!list.length) return;
    crop.value = list[0]!.crop;
    season.value = list[0]!.season;
    year.value = list[0]!.year;
  },
  { immediate: true },
);

watch(crop, () => {
  if (!seasonOptions.value.includes(season.value)) {
    season.value = seasonOptions.value[0] || "";
  }
});

watch([crop, season], () => {
  if (!yearOptions.value.includes(year.value)) {
    year.value = yearOptions.value[0] || 0;
  }
});

const activeSeries = computed(
  () =>
    props.series.find(
      (s) =>
        s.crop === crop.value &&
        s.season === season.value &&
        s.year === year.value,
    ) || null,
);
</script>

<style scoped>
.yield-filter-select {
  min-width: 5.5rem;
  max-width: 7.5rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: #fff;
  padding: 0.375rem 1.75rem 0.375rem 0.625rem;
  font-size: 0.8125rem;
  color: var(--color-ink);
  white-space: nowrap;
}
</style>
