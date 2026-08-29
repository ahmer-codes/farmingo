<template>
  <section class="space-y-4" aria-label="Farm analytics">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h2 class="type-section">Farm performance</h2>
        <p class="type-body mt-0.5">
          Real yield, health, and crop distribution from your records.
        </p>
      </div>
      <NuxtLink
        to="/yield"
        class="text-sm font-medium text-brand-700 hover:text-brand-800"
      >
        Full analytics →
      </NuxtLink>
    </div>

    <!-- Yield achievement hero -->
    <article class="surface-card overflow-hidden">
      <div class="grid lg:grid-cols-5">
        <div
          class="border-b border-line p-5 lg:col-span-2 lg:border-b-0 lg:border-r"
        >
          <p class="type-label">Expected vs actual yield</p>
          <div class="mt-3 space-y-3">
            <div>
              <p class="text-xs text-ink-muted">Expected</p>
              <p class="text-2xl font-semibold tabular-nums text-ink">
                {{ analytics.yieldSummary.formattedExpected }}
              </p>
            </div>
            <div>
              <p class="text-xs text-ink-muted">Actual</p>
              <p class="text-2xl font-semibold tabular-nums text-brand-700">
                {{ analytics.yieldSummary.formattedActual }}
              </p>
            </div>
            <div class="flex flex-wrap gap-3 border-t border-line pt-3">
              <div>
                <p class="text-xs text-ink-muted">Difference</p>
                <p
                  class="text-sm font-semibold tabular-nums"
                  :class="
                    analytics.yieldSummary.difference >= 0
                      ? 'text-success'
                      : 'text-danger'
                  "
                >
                  {{ diffLabel }}
                </p>
              </div>
              <div>
                <p class="text-xs text-ink-muted">Achievement</p>
                <p class="text-sm font-semibold tabular-nums text-ink">
                  {{ analytics.yieldSummary.achievementPercent }}%
                </p>
              </div>
            </div>
          </div>
          <UiProgressIndicator
            class="mt-4"
            :value="Math.min(100, analytics.yieldSummary.achievementPercent)"
            label="Yield achievement"
            :tone="achievementTone"
          />
        </div>
        <div class="p-5 lg:col-span-3">
          <ChartsBarCompareChart
            embedded
            title="Yield by crop"
            :points="yieldByCropPoints"
            :value-unit="analytics.yieldSummary.unit"
            empty-message="Record actual yields on your crops to see comparisons."
          />
        </div>
      </div>
    </article>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <ChartsDonutChart
        title="Crop health distribution"
        description="Healthy, at-risk, and critical crops on your farm."
        :slices="healthSlices"
        center-label="Crops"
        empty-message="Add crops to see health distribution."
      />

      <ChartsDonutChart
        title="Crop area distribution"
        description="Share of farm area by crop type."
        :slices="cropAreaSlices"
        center-label="Area"
        value-suffix="%"
        empty-message="Add crops with area data to see distribution."
      />

      <ChartsHealthScoreBars
        title="Health score by crop"
        description="Current health scores from your crop records."
        :items="analytics.healthByCrop"
      />
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <ChartsBarCompareChart
        v-if="analytics.yieldByField.length"
        title="Field performance"
        description="Expected vs actual yield grouped by field."
        :points="yieldByFieldPoints"
        :value-unit="analytics.yieldSummary.unit"
      />

      <ChartsLineTrendChart
        v-if="analytics.hasYieldTrend"
        title="Yield trend"
        description="Historical expected vs actual totals."
        :points="analytics.yieldTrend"
      />

      <div
        v-else-if="analytics.yieldByCrop.length === 1"
        class="surface-card p-5"
      >
        <UiSectionHeader
          title="Current season comparison"
          description="Record more harvest periods to unlock trend charts."
        />
        <ChartsBarCompareChart
          embedded
          :points="yieldByCropPoints"
          :value-unit="analytics.yieldSummary.unit"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DashboardAnalytics } from "~/types/dashboard";
import type { YieldChartPoint } from "~/types/crop";

const props = defineProps<{ analytics: DashboardAnalytics }>();

const diffLabel = computed(() => {
  const d = props.analytics.yieldSummary.difference;
  const u = props.analytics.yieldSummary.unit;
  const abs = Math.abs(d).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
  if (d > 0) return `+${abs} ${u}`;
  if (d < 0) return `−${abs} ${u}`;
  return "On target";
});

const achievementTone = computed(() => {
  const p = props.analytics.yieldSummary.achievementPercent;
  if (p >= 95) return "success" as const;
  if (p >= 80) return "warning" as const;
  return "danger" as const;
});

const yieldByCropPoints = computed((): YieldChartPoint[] =>
  props.analytics.yieldByCrop.map((r) => ({
    label: r.label,
    expected: r.expected,
    actual: r.actual,
    yieldPerHa: 0,
  })),
);

const yieldByFieldPoints = computed((): YieldChartPoint[] =>
  props.analytics.yieldByField.map((r) => ({
    label: r.label,
    expected: r.expected,
    actual: r.actual,
  })),
);

const healthSlices = computed(() => props.analytics.healthDistribution);

const cropAreaSlices = computed(() =>
  props.analytics.cropDistribution.map((c, i) => ({
    label: c.label,
    value: c.value,
    color: ["#16a34a", "#2563eb", "#d97706", "#7c3aed", "#0891b2"][i % 5],
  })),
);
</script>
