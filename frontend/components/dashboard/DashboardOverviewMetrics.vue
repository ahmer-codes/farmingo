<template>
  <section aria-label="Farm overview">
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
      <FarmStatCard
        label="Total farm area"
        :value="overview.totalArea.value"
        :unit="overview.totalArea.unit"
        :helper="overview.totalArea.helper"
      />
      <FarmStatCard
        label="Active crops"
        :value="overview.activeCrops.value"
        :helper="overview.activeCrops.helper"
      />
      <FarmStatCard
        label="Expected yield"
        :value="overview.estimatedYield.value"
        :unit="overview.estimatedYield.unit"
        :helper="overview.estimatedYield.helper"
      />
      <FarmStatCard
        label="Actual yield"
        :value="overview.actualYield.value"
        :unit="overview.actualYield.unit"
        :helper="overview.actualYield.helper"
      />
      <FarmStatCard
        label="Yield achievement"
        :value="overview.yieldAchievement.value"
        :helper="overview.yieldAchievement.helper"
        :delta-tone="achievementTone"
      />
      <FarmStatCard
        label="Tasks completed"
        :value="overview.completedTasks.value"
        :helper="overview.completedTasks.helper"
        delta-tone="positive"
      />
      <FarmStatCard
        label="Tasks pending"
        :value="overview.pendingTasks.value"
        :helper="overview.pendingTasks.helper"
        :delta="pendingDelta"
        :delta-tone="pendingTone"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { FarmOverviewMetrics } from "~/types";

const props = defineProps<{ overview: FarmOverviewMetrics }>();

const pendingDelta = computed(() => {
  const helper = props.overview.pendingTasks.helper;
  return helper.includes("overdue") ? helper.split("·")[0]?.trim() : undefined;
});

const pendingTone = computed(() =>
  pendingDelta.value ? ("negative" as const) : ("neutral" as const),
);

const achievementTone = computed(() => {
  const val = parseFloat(props.overview.yieldAchievement.value);
  if (val >= 95) return "positive" as const;
  if (val >= 80) return "neutral" as const;
  return "negative" as const;
});
</script>
