<template>
  <div :class="embedded ? '' : 'surface-card p-4'">
    <UiSectionHeader
      v-if="!embedded"
      title="Yield vs plan"
      description="Expected versus actual production for the selected crop and season."
    />

    <div :class="embedded ? (compact ? '' : 'mt-2') : 'mt-5'">
      <div ref="chartRoot" class="relative">
        <ChartsChartHoverTooltip :tooltip="tooltip" />

        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          class="w-full"
          :class="svgClass"
          role="img"
          :aria-label="ariaLabel"
        >
          <g v-for="tick in yTicks" :key="tick">
            <line
              x1="40"
              :y1="yScale(tick)"
              :x2="chartWidth - 20"
              :y2="yScale(tick)"
              class="stroke-line"
              stroke-width="1"
            />
            <text
              x="32"
              :y="yScale(tick) + 4"
              text-anchor="end"
              class="fill-ink-muted"
              font-size="10"
            >
              {{ tick }}
            </text>
          </g>

          <g v-for="(point, index) in points" :key="point.label">
            <rect
              :x="xFor(index) - 10"
              :y="yScale(point.expectedKg)"
              width="10"
              :height="baseline - yScale(point.expectedKg)"
              class="cursor-pointer fill-brand-200 transition-opacity hover:opacity-75"
              rx="2"
              @mouseenter="
                onBarEnter($event, 'Expected', point.expectedKg, point.label)
              "
              @mousemove="
                onBarMove($event, 'Expected', point.expectedKg, point.label)
              "
              @mouseleave="hide"
            />
            <rect
              :x="xFor(index) + 2"
              :y="yScale(point.actualKg)"
              width="10"
              :height="baseline - yScale(point.actualKg)"
              class="cursor-pointer fill-brand-600 transition-opacity hover:opacity-80"
              rx="2"
              @mouseenter="
                onBarEnter($event, 'Actual', point.actualKg, point.label)
              "
              @mousemove="
                onBarMove($event, 'Actual', point.actualKg, point.label)
              "
              @mouseleave="hide"
            />
            <text
              :x="xFor(index) + 1"
              :y="chartHeight - 8"
              text-anchor="middle"
              class="fill-ink-muted pointer-events-none"
              font-size="10"
            >
              {{ point.label.replace("Week ", "W") }}
            </text>
          </g>
        </svg>
      </div>

      <div class="mt-1.5 flex flex-wrap gap-4 type-helper">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-brand-200" /> Expected
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-2.5 w-2.5 rounded-sm bg-brand-600" /> Actual
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { YieldPoint } from "~/types";
import {
  formatChartValue,
  useChartHoverTooltip,
} from "~/composables/useChartHoverTooltip";

const props = withDefaults(
  defineProps<{
    points: YieldPoint[];
    embedded?: boolean;
    compact?: boolean;
  }>(),
  { embedded: false, compact: false },
);

const chartRoot = ref<HTMLElement | null>(null);
const { tooltip, show, hide } = useChartHoverTooltip(chartRoot);

const chartHeight = computed(() => {
  if (props.compact || (props.embedded && props.points.length <= 2)) return 150;
  return 180;
});

const chartWidth = computed(() => {
  const count = Math.max(props.points.length, 1);
  if (props.compact || (props.embedded && count <= 2)) {
    return Math.max(180, 72 + count * 64);
  }
  return Math.min(420, 80 + count * 58);
});

const svgClass = computed(() => {
  if (props.compact || (props.embedded && props.points.length <= 2)) {
    return "mx-auto h-32 max-w-xs";
  }
  return "h-44";
});

const baseline = computed(() => chartHeight.value - 30);
const maxValue = computed(() => {
  const values = props.points.flatMap((p) => [p.expectedKg, p.actualKg]);
  return Math.ceil(Math.max(...values, 1) / 100) * 100;
});

const yTicks = computed(() => {
  const max = maxValue.value;
  return [0, max / 2, max];
});

function yScale(value: number) {
  const max = maxValue.value || 1;
  return baseline.value - (value / max) * (chartHeight.value - 50);
}

function xFor(index: number) {
  const count = props.points.length;
  const width = chartWidth.value;
  if (count <= 1) return width / 2;
  const innerStart = 52;
  const innerSpan = width - innerStart - 32;
  return innerStart + (index + 0.5) * (innerSpan / count);
}

const ariaLabel = computed(() => {
  const latest = props.points[props.points.length - 1];
  if (!latest) return "Yield trend chart";
  return `Yield trend. Latest period actual ${latest.actualKg} versus expected ${latest.expectedKg}.`;
});

function tooltipText(series: string, value: number, label: string) {
  return `${label} · ${series}: ${formatChartValue(value)}`;
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
