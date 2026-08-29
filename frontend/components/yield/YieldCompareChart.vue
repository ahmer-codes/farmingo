<template>
  <ChartsBarCompareChart
    :points="points"
    :title="title"
    :description="description"
    :embedded="embedded"
    :value-unit="valueUnit"
  />
</template>

<script setup lang="ts">
import type { YieldChartPoint } from "~/types/crop";

withDefaults(
  defineProps<{
    points: YieldChartPoint[];
    title?: string;
    description?: string;
    valueUnit?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Yield comparison",
    description: "Expected versus actual production",
    valueUnit: "",
    embedded: false,
  },
);
</script>
