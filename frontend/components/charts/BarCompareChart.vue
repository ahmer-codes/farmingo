<template>
  <div :class="embedded ? '' : 'surface-card p-4 sm:p-5'">
    <UiSectionHeader
      v-if="!embedded"
      :title="title"
      :description="description"
    />

    <ChartsChartEmptyState
      v-if="!points.length"
      class="mt-4"
      :message="emptyMessage"
    />

    <div v-else :class="embedded ? 'mt-1' : 'mt-4'">
      <div ref="chartRoot" class="relative">
        <ChartsChartHoverTooltip :tooltip="tooltip" />

        <svg
          :viewBox="`0 0 ${width} ${height}`"
          class="h-48 w-full sm:h-52"
          role="img"
          :aria-label="title"
        >
          <g v-for="tick in yTicks" :key="tick">
            <line
              x1="44"
              :y1="yScale(tick)"
              :x2="width - 12"
              :y2="yScale(tick)"
              class="stroke-line"
              stroke-width="1"
            />
            <text
              x="36"
              :y="yScale(tick) + 4"
              text-anchor="end"
              class="fill-ink-muted"
              font-size="10"
            >
              {{ formatTick(tick) }}
            </text>
          </g>

          <g v-for="(point, index) in points" :key="`${point.label}-${index}`">
            <rect
              :x="xFor(index) - barWidth - 2"
              :y="yScale(point.expected)"
              :width="barWidth"
              :height="Math.max(0, baseline - yScale(point.expected))"
              class="cursor-pointer fill-brand-200 transition-opacity hover:opacity-75"
              rx="2"
              @mouseenter="
                onBarEnter($event, 'Expected', point.expected, point.label)
              "
              @mousemove="
                onBarMove($event, 'Expected', point.expected, point.label)
              "
              @mouseleave="hide"
            />
            <rect
              :x="xFor(index) + 2"
              :y="yScale(point.actual)"
              :width="barWidth"
              :height="Math.max(0, baseline - yScale(point.actual))"
              class="cursor-pointer fill-brand-600 transition-opacity hover:opacity-80"
              rx="2"
              @mouseenter="
                onBarEnter($event, 'Actual', point.actual, point.label)
              "
              @mousemove="
                onBarMove($event, 'Actual', point.actual, point.label)
              "
              @mouseleave="hide"
            />
            <text
              :x="xFor(index)"
              :y="height - 8"
              text-anchor="middle"
              class="fill-ink-muted pointer-events-none"
              font-size="10"
            >
              {{ shortLabel(point.label) }}
            </text>
          </g>
        </svg>
      </div>

      <div class="mt-2 flex flex-wrap gap-4 type-helper">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-brand-200" /> {{ leftLegend }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-brand-600" /> {{ rightLegend }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { YieldChartPoint } from "~/types/crop";
import {
  formatChartValue,
  useChartHoverTooltip,
} from "~/composables/useChartHoverTooltip";

const props = withDefaults(
  defineProps<{
    points: YieldChartPoint[];
    title?: string;
    description?: string;
    emptyMessage?: string;
    valueUnit?: string;
    leftLegend?: string;
    rightLegend?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Yield comparison",
    description: "Expected versus actual production",
    emptyMessage: "No yield data available yet.",
    valueUnit: "",
    leftLegend: "Expected",
    rightLegend: "Actual",
    embedded: false,
  },
);

const chartRoot = ref<HTMLElement | null>(null);
const { tooltip, show, hide } = useChartHoverTooltip(chartRoot);

const width = 420;
const height = 180;
const baseline = 150;

const maxValue = computed(() => {
  const values = props.points.flatMap((p) => [p.expected, p.actual]);
  const max = Math.max(...values, 1);
  return Math.ceil(max / 100) * 100 || 100;
});

const yTicks = computed(() => {
  const max = maxValue.value;
  return [0, max / 2, max];
});

const barWidth = computed(() => {
  const n = Math.max(props.points.length, 1);
  return Math.min(14, Math.floor(280 / n / 2));
});

function yScale(value: number) {
  const max = maxValue.value || 1;
  return baseline - (value / max) * 120;
}

function xFor(index: number) {
  const n = Math.max(props.points.length, 1);
  const span = 340;
  return 70 + (index + 0.5) * (span / n);
}

function shortLabel(label: string) {
  if (label.length <= 10) return label;
  return label.slice(0, 10);
}

function formatTick(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

function tooltipText(series: string, value: number, label: string) {
  const unit = props.valueUnit ? ` ${props.valueUnit}` : "";
  return `${label} · ${series}: ${formatChartValue(value)}${unit}`;
}

function onBarEnter(
  event: MouseEvent,
  series: string,
  value: number,
  label: string,
) {
  show(event, tooltipText(series, value, label));
}

function onBarMove(
  event: MouseEvent,
  series: string,
  value: number,
  label: string,
) {
  show(event, tooltipText(series, value, label));
}
</script>
