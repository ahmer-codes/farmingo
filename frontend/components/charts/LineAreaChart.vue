<template>
  <div :class="embedded ? '' : 'surface-card p-4 sm:p-5'">
    <UiSectionHeader
      v-if="!embedded"
      :title="title"
      :description="description"
    />

    <ChartsChartEmptyState
      v-if="!hasData"
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
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1a4d2e" stop-opacity="0.28" />
              <stop offset="100%" stop-color="#1a4d2e" stop-opacity="0.02" />
            </linearGradient>
          </defs>

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

          <polygon
            v-if="areaPoints"
            :points="areaPoints"
            :fill="`url(#${gradientId})`"
          />

          <polyline
            :points="linePoints"
            fill="none"
            class="stroke-brand-600"
            stroke-width="2.5"
            stroke-linejoin="round"
          />

          <g v-for="(point, index) in points" :key="`${point.label}-${index}`">
            <circle
              :cx="xFor(index)"
              :cy="yScale(point.value)"
              r="4"
              class="cursor-pointer fill-brand-600"
              @mouseenter="onPointEnter($event, point)"
              @mousemove="onPointMove($event, point)"
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

      <div v-if="seriesLabel" class="mt-2 type-helper">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-4 bg-brand-600" />
          {{ seriesLabel }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  formatChartValue,
  useChartHoverTooltip,
} from "~/composables/useChartHoverTooltip";

const props = withDefaults(
  defineProps<{
    points: Array<{ label: string; value: number }>;
    title?: string;
    description?: string;
    emptyMessage?: string;
    seriesLabel?: string;
    valueSuffix?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Trend",
    description: "",
    emptyMessage: "Not enough data yet.",
    seriesLabel: "",
    valueSuffix: "",
    embedded: false,
  },
);

const gradientId = `line-area-${Math.random().toString(36).slice(2, 9)}`;
const chartRoot = ref<HTMLElement | null>(null);
const { tooltip, show, hide } = useChartHoverTooltip(chartRoot);

const width = 420;
const height = 180;
const baseline = 150;

const hasData = computed(() => props.points.some((p) => p.value > 0));

const maxValue = computed(() => {
  const max = Math.max(...props.points.map((p) => p.value), 1);
  return Math.ceil(max / 5) * 5 || 5;
});

const yTicks = computed(() => {
  const max = maxValue.value;
  return [0, Math.round(max / 2), max];
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

const linePoints = computed(() =>
  props.points.map((p, i) => `${xFor(i)},${yScale(p.value)}`).join(" "),
);

const areaPoints = computed(() => {
  if (!props.points.length) return "";
  const top = props.points
    .map((p, i) => `${xFor(i)},${yScale(p.value)}`)
    .join(" ");
  const firstX = xFor(0);
  const lastX = xFor(props.points.length - 1);
  return `${firstX},${baseline} ${top} ${lastX},${baseline}`;
});

function shortLabel(label: string) {
  if (label.length <= 10) return label;
  return `${label.slice(5)}`;
}

function formatTick(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

function tooltipText(point: { label: string; value: number }) {
  const suffix = props.valueSuffix ? ` ${props.valueSuffix}` : "";
  return `${point.label}: ${formatChartValue(point.value)}${suffix}`;
}

function onPointEnter(
  event: MouseEvent,
  point: { label: string; value: number },
) {
  show(event, tooltipText(point));
}

function onPointMove(
  event: MouseEvent,
  point: { label: string; value: number },
) {
  show(event, tooltipText(point));
}
</script>
