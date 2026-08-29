<template>
  <header
    class="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between"
  >
    <div>
      <p class="type-label">{{ greeting }}</p>
      <h2 class="type-page-title mt-1">{{ farmName }}</h2>
      <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 type-body">
        <span>{{ location }}</span>
        <span class="text-line-strong" aria-hidden="true">·</span>
        <time :datetime="isoDate">{{ displayDate }}</time>
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <NuxtLink
        to="/disease-detection"
        class="inline-flex items-center rounded-md bg-brand-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Assess crop health
      </NuxtLink>
      <NuxtLink
        to="/tasks"
        class="inline-flex items-center rounded-md border border-line bg-white px-3.5 py-2 text-sm font-semibold text-ink hover:bg-surface-muted"
      >
        Today’s tasks
      </NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  farmerName: string;
  farmName: string;
  location: string;
}>();

const now = new Date();
const isoDate = now.toISOString().slice(0, 10);

const greeting = computed(() => {
  const hour = now.getHours();
  const part =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = props.farmerName.split(/\s+/)[0] || "Farmer";
  return `${part}, ${first}`;
});

const displayDate = computed(() =>
  now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }),
);
</script>
