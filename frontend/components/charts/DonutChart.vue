<template>
  <div :class="embedded ? '' : 'surface-card p-4 sm:p-5'">
    <UiSectionHeader
      v-if="!embedded"
      :title="title"
      :description="description"
    />

    <ChartsChartEmptyState
      v-if="!slices.length"
      class="mt-4"
      :message="emptyMessage"
    />

    <div v-else class="mt-4 flex flex-col items-center gap-4">
      <div ref="chartRoot" class="relative">
        <ChartsChartHoverTooltip :tooltip="tooltip" />

        <svg
          :viewBox="`0 0 ${size} ${size}`"
          class="h-44 w-44 sm:h-48 sm:w-48"
          role="img"
          :aria-label="title"
        >
          <circle
            :cx="center"
            :cy="center"
            :r="radius"
            fill="none"
            class="stroke-line"
            stroke-width="20"
          />

          <circle
            v-for="(seg, i) in segments"
            :key="seg.label"
            :cx="center"
            :cy="center"
            :r="radius"
            fill="none"
            :stroke="seg.color"
            :stroke-width="hoveredIndex === i ? 24 : 20"
            :stroke-dasharray="`${seg.length} ${circumference - seg.length}`"
            :stroke-dashoffset="seg.offset"
            class="cursor-pointer transition-all"
            :class="
              hoveredIndex === null || hoveredIndex === i
                ? 'opacity-100'
                : 'opacity-45'
            "
            :transform="`rotate(-90 ${center} ${center})`"
            @mouseenter="onSliceEnter($event, seg, i)"
            @mousemove="onSliceMove($event, seg, i)"
            @mouseleave="onSliceLeave"
          />

          <text
            :x="center"
            :y="center - 4"
            text-anchor="middle"
            class="fill-ink pointer-events-none font-semibold"
            font-size="18"
          >
            {{ centerDisplay }}
          </text>
          <text
            :x="center"
            :y="center + 14"
            text-anchor="middle"
            class="fill-ink-muted pointer-events-none"
            font-size="10"
          >
            {{ centerLabel }}
          </text>
        </svg>
      </div>

      <ul
        v-if="showLegend"
        class="flex w-full max-w-md flex-wrap justify-center gap-x-4 gap-y-2 px-1"
        aria-label="Chart legend"
      >
        <li
          v-for="(seg, i) in segments"
          :key="`legend-${seg.label}`"
          class="flex items-center gap-2 text-xs"
          :class="
            hoveredIndex === null || hoveredIndex === i
              ? 'opacity-100'
              : 'opacity-50'
          "
          @mouseenter="hoveredIndex = i"
          @mouseleave="hoveredIndex = null"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-sm"
            :style="{ backgroundColor: seg.color }"
            aria-hidden="true"
          />
          <span class="font-medium text-ink">{{ seg.label }}</span>
          <span class="tabular-nums text-ink-muted">
            {{ formatSliceValue({ label: seg.label, value: seg.value }) }}
            <template v-if="valueSuffix !== '%'">
              ({{ percentOfTotal(seg.value) }}%)</template
            >
          </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartSlice } from "~/types/dashboard";
import { useChartHoverTooltip } from "~/composables/useChartHoverTooltip";

const props = withDefaults(
  defineProps<{
    slices: ChartSlice[];
    title?: string;
    description?: string;
    emptyMessage?: string;
    centerLabel?: string;
    valueSuffix?: string;
    embedded?: boolean;
    showLegend?: boolean;
  }>(),
  {
    title: "Distribution",
    description: "",
    emptyMessage: "No data to display yet.",
    centerLabel: "Total",
    valueSuffix: "",
    embedded: false,
    showLegend: true,
  },
);

const defaultColors = [
  "#16a34a",
  "#2563eb",
  "#d97706",
  "#ea580c",
  "#dc2626",
  "#7c3aed",
];
const size = 160;
const center = size / 2;
const radius = 58;
const circumference = 2 * Math.PI * radius;

const chartRoot = ref<HTMLElement | null>(null);
const { tooltip, show, hide } = useChartHoverTooltip(chartRoot);
const hoveredIndex = ref<number | null>(null);

const total = computed(() => props.slices.reduce((s, x) => s + x.value, 0));

const centerDisplay = computed(() => {
  if (hoveredIndex.value != null) {
    const slice = props.slices[hoveredIndex.value];
    if (slice) return formatSliceValue(slice);
  }
  if (props.valueSuffix === "%") return "100%";
  return total.value;
});

const segments = computed(() => {
  const t = total.value || 1;
  let offset = 0;
  return props.slices.map((slice, i) => {
    const length = (slice.value / t) * circumference;
    const seg = {
      label: slice.label,
      value: slice.value,
      color: slice.color || defaultColors[i % defaultColors.length],
      length,
      offset: -offset,
    };
    offset += length;
    return seg;
  });
});

function percentOfTotal(value: number) {
  const t = total.value || 1;
  const pct = (value / t) * 100;
  return pct % 1 === 0 ? String(pct) : pct.toFixed(1);
}

function formatSliceValue(slice: ChartSlice) {
  if (props.valueSuffix === "%") return `${slice.value}%`;
  return `${slice.value}${props.valueSuffix}`;
}

function tooltipText(slice: { label: string; value: number }) {
  if (props.valueSuffix === "%") {
    return `${slice.label}: ${slice.value}%`;
  }
  return `${slice.label}: ${slice.value}${props.valueSuffix} (${percentOfTotal(slice.value)}%)`;
}

function onSliceEnter(
  event: MouseEvent,
  slice: { label: string; value: number },
  index: number,
) {
  hoveredIndex.value = index;
  show(event, tooltipText(slice));
}

function onSliceMove(
  event: MouseEvent,
  slice: { label: string; value: number },
  index: number,
) {
  hoveredIndex.value = index;
  show(event, tooltipText(slice));
}

function onSliceLeave() {
  hoveredIndex.value = null;
  hide();
}
</script>
