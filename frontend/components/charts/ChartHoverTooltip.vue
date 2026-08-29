<template>
  <div
    v-if="tooltip"
    class="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[11px] font-medium tabular-nums text-white shadow-card"
    :style="{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }"
    role="tooltip"
  >
    {{ tooltip.text }}
  </div>
</template>

<script setup lang="ts">
import type { ChartTooltipState } from "~/composables/useChartHoverTooltip";

defineProps<{ tooltip: ChartTooltipState | null }>();
</script>
