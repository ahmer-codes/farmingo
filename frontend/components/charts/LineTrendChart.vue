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

        <polyline
          :points="expectedLine"
          fill="none"
          class="stroke-brand-300"
          stroke-width="2"
          stroke-linejoin="round"
        />
        <polyline
          :points="actualLine"
          fill="none"
          class="stroke-brand-600"
          stroke-width="2.5"
          stroke-linejoin="round"
        />

        <g v-for="(point, index) in points" :key="point.label">
          <circle
            :cx="xFor(index)"
            :cy="yScale(point.expected)"
            r="3"
            class="fill-brand-300"
          />
          <circle
            :cx="xFor(index)"
            :cy="yScale(point.actual)"
            r="3.5"
            class="fill-brand-600"
          />
          <text
            :x="xFor(index)"
            :y="height - 8"
            text-anchor="middle"
            class="fill-ink-muted"
            font-size="10"
          >
            {{ shortLabel(point.label) }}
          </text>
        </g>
      </svg>

      <div class="mt-2 flex flex-wrap gap-4 type-helper">
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-4 bg-brand-300" /> Expected
        </span>
        <span class="inline-flex items-center gap-1.5">
          <span class="h-0.5 w-4 bg-brand-600" /> Actual
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    points: Array<{ label: string; expected: number; actual: number }>;
    title?: string;
    description?: string;
    emptyMessage?: string;
    embedded?: boolean;
  }>(),
  {
    title: "Yield trend",
    description: "Expected vs actual over time",
    emptyMessage:
      "Not enough historical data yet. Keep recording harvests to see your trend.",
    embedded: false,
  },
);

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

function yScale(value: number) {
  const max = maxValue.value || 1;
  return baseline - (value / max) * 120;
}

function xFor(index: number) {
  const n = Math.max(props.points.length, 1);
  const span = 340;
  return 70 + (index + 0.5) * (span / n);
}

const expectedLine = computed(() =>
  props.points.map((p, i) => `${xFor(i)},${yScale(p.expected)}`).join(" "),
);

const actualLine = computed(() =>
  props.points.map((p, i) => `${xFor(i)},${yScale(p.actual)}`).join(" "),
);

function shortLabel(label: string) {
  return label.length <= 12 ? label : `${label.slice(0, 11)}…`;
}

function formatTick(n: number) {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}
</script>
