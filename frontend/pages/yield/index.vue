<template>
  <div class="space-y-6">
    <UiPageHeroBanner
      :image-src="yieldHeroImage"
      title="Yield analytics"
      description="Expected vs actual production, crop health, field performance, and seasonal trends, all from your farm records."
    />

    <div
      v-if="isInitialLoad"
      class="space-y-6"
      aria-busy="true"
      aria-label="Loading yield analytics"
    >
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="n in 4" :key="n" class="surface-card p-4">
          <UiSkeleton height="xs" width="sm" />
          <UiSkeleton class="mt-3" height="md" width="full" />
        </div>
      </div>
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <UiStatCardSkeleton v-for="n in 6" :key="n" />
      </div>
      <div class="grid gap-4 lg:grid-cols-2">
        <div v-for="n in 4" :key="n" class="surface-card p-4">
          <UiSkeleton height="sm" width="md" />
          <UiSkeleton class="mt-4 !h-48" height="xl" width="full" />
        </div>
      </div>
    </div>

    <UiErrorState
      v-else-if="fetchError && !analytics"
      :message="fetchError"
      retry-label="Try again"
      @retry="load"
    />

    <template v-else-if="analytics">
      <section class="relative surface-card p-4 md:hidden">
        <div class="mb-3 flex items-center justify-between gap-2">
          <p class="type-label">Filters</p>
          <span
            v-if="refreshing"
            class="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted"
          >
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
            />
            Updating…
          </span>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <UiAppSelect
            v-model="filters.crop"
            label="Crop"
            :options="cropOptions"
            :disabled="refreshing"
          />
          <UiAppSelect
            v-model="filters.field"
            label="Field"
            :options="fieldOptions"
            :disabled="refreshing"
          />
          <UiAppSelect
            v-model="filters.season"
            label="Season"
            :options="seasonOptions"
            :disabled="refreshing"
          />
          <UiAppSelect
            v-model="filters.year"
            label="Year"
            :options="yearOptions"
            :disabled="refreshing"
          />
        </div>
      </section>

      <section
        class="relative hidden gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4"
      >
        <div
          v-if="refreshing"
          class="absolute -top-1 right-0 z-10 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted"
        >
          <span
            class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
          />
          Updating…
        </div>
        <div class="surface-card p-4">
          <UiAppSelect
            v-model="filters.crop"
            label="Crop"
            :options="cropOptions"
            :disabled="refreshing"
          />
        </div>
        <div class="surface-card p-4">
          <UiAppSelect
            v-model="filters.field"
            label="Field"
            :options="fieldOptions"
            :disabled="refreshing"
          />
        </div>
        <div class="surface-card p-4">
          <UiAppSelect
            v-model="filters.season"
            label="Season"
            :options="seasonOptions"
            :disabled="refreshing"
          />
        </div>
        <div class="surface-card p-4">
          <UiAppSelect
            v-model="filters.year"
            label="Year"
            :options="yearOptions"
            :disabled="refreshing"
          />
        </div>
      </section>

      <div
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <FarmStatCard
          label="Expected yield"
          :value="formatNum(summary.expectedYield)"
          :unit="summary.yieldUnit"
        />
        <FarmStatCard
          label="Actual yield"
          :value="formatNum(summary.actualYield)"
          :unit="summary.yieldUnit"
        />
        <FarmStatCard
          label="Yield difference"
          :value="formatDiff(summary.yieldDifference)"
          :unit="summary.yieldUnit"
          :helper="`${summary.yieldDifferencePercent}% vs plan`"
        />
        <FarmStatCard
          label="Yield per hectare"
          :value="formatNum(summary.yieldPerHa)"
          :unit="`${summary.yieldUnit}/${summary.landUnitLabel}`"
        />
        <FarmStatCard
          label="Best performing"
          :value="summary.bestPerformingCrop?.name || '-'"
          value-size="text"
          :helper="
            summary.bestPerformingCrop
              ? `${formatNum(summary.bestPerformingCrop.yieldPerHa)} ${summary.yieldUnit}/ha`
              : 'No data'
          "
        />
        <FarmStatCard
          label="Lowest performing"
          :value="summary.lowestPerformingCrop?.name || '-'"
          value-size="text"
          :helper="
            summary.lowestPerformingCrop
              ? `${formatNum(summary.lowestPerformingCrop.yieldPerHa)} ${summary.yieldUnit}/ha`
              : 'No data'
          "
        />
      </div>

      <section
        class="grid gap-4 lg:grid-cols-2 transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <ChartsBarCompareChart
          title="Yield over time"
          description="Seasonal expected vs actual totals from your records."
          :points="analytics.charts.overTime"
          :value-unit="summary.yieldUnit"
        />
        <ChartsBarCompareChart
          title="Expected vs actual by crop"
          description="Compare planned and harvested production for each crop."
          :points="analytics.charts.expectedVsActual"
          :value-unit="summary.yieldUnit"
        />
        <ChartsBarCompareChart
          title="Yield by crop"
          description="Production totals grouped by crop."
          :points="analytics.charts.byCrop"
          :value-unit="summary.yieldUnit"
        />
        <ChartsBarCompareChart
          title="Yield by field"
          description="Production totals grouped by field."
          :points="analytics.charts.byField"
          :value-unit="summary.yieldUnit"
        />
      </section>

      <section
        v-if="cropAnalytics"
        class="space-y-4 transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <h3 class="type-section">Crop analysis</h3>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <ChartsDonutChart
            title="Crop health distribution"
            description="Healthy, at-risk, and critical crops."
            :slices="cropAnalytics.healthDistribution"
            center-label="Crops"
          />
          <ChartsDonutChart
            title="Crop area distribution"
            description="Share of farm area by crop."
            :slices="cropAnalytics.cropAreaSlices"
            center-label="Area"
            value-suffix="%"
          />
          <ChartsHealthScoreBars
            title="Health score by crop"
            :items="cropAnalytics.healthByCrop"
          />
        </div>
      </section>

      <section
        v-if="hasYieldTrend"
        class="transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <ChartsLineTrendChart
          title="Historical yield trend"
          description="Expected vs actual over recorded periods."
          :points="analytics.charts.overTime"
        />
      </section>

      <section
        v-if="taskSlices.length"
        class="transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <h3 class="type-section">Operations</h3>
        <div class="grid gap-4 md:grid-cols-2">
          <ChartsDonutChart
            title="Tasks by status"
            description="Current task workload on your farm."
            :slices="taskSlices"
            center-label="Tasks"
          />
        </div>
      </section>

      <section
        class="surface-card p-4 sm:p-5 transition-opacity"
        :class="{ 'opacity-60': refreshing }"
      >
        <UiSectionHeader
          title="Yield records"
          :description="`${summary.recordCount} observation(s) in the current filter`"
        />

        <ul v-if="analytics.records.length" class="mt-4 space-y-3 md:hidden">
          <li
            v-for="row in analytics.records"
            :key="row.id"
            class="min-w-0 rounded-md border border-line bg-canvas/40 p-3"
          >
            <div class="min-w-0">
              <p class="break-words text-sm font-semibold text-ink">
                {{ row.cropName }}
              </p>
              <p class="type-helper mt-0.5 break-words">
                {{ row.fieldName }} · {{ row.periodLabel }}
              </p>
            </div>
            <dl class="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3">
              <div class="min-w-0">
                <dt class="type-label">Expected</dt>
                <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
                  {{ row.expectedYield.toLocaleString() }}
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="type-label">Actual</dt>
                <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
                  {{ row.actualYield.toLocaleString() }}
                </dd>
              </div>
              <div class="min-w-0">
                <dt class="type-label">Per ha</dt>
                <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
                  {{ row.yieldPerHa }}
                </dd>
              </div>
            </dl>
          </li>
        </ul>

        <div
          v-if="analytics.records.length"
          class="mt-4 hidden overflow-x-auto md:block"
        >
          <table class="min-w-full text-left text-sm">
            <thead class="border-b border-line type-label">
              <tr>
                <th class="py-2 pr-3">Period</th>
                <th class="py-2 pr-3">Crop</th>
                <th class="py-2 pr-3">Field</th>
                <th class="py-2 pr-3">Expected</th>
                <th class="py-2 pr-3">Actual</th>
                <th class="py-2">Per ha</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line">
              <tr v-for="row in analytics.records" :key="row.id">
                <td class="py-2.5 pr-3">{{ row.periodLabel }}</td>
                <td class="py-2.5 pr-3">{{ row.cropName }}</td>
                <td class="py-2.5 pr-3">{{ row.fieldName }}</td>
                <td class="py-2.5 pr-3 tabular-nums">
                  {{ row.expectedYield.toLocaleString() }}
                </td>
                <td class="py-2.5 pr-3 tabular-nums">
                  {{ row.actualYield.toLocaleString() }}
                </td>
                <td class="py-2.5 tabular-nums">{{ row.yieldPerHa }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <UiEmptyState
          v-else
          class="mt-4"
          title="No yield records for these filters"
          description="Adjust crop, field, season, or year, or record actual yields on the Crops page."
          :image-src="emptyCropImage"
        >
          <template #action>
            <UiAppButton variant="secondary" @click="resetFilters">
              Reset filters
            </UiAppButton>
          </template>
        </UiEmptyState>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { AsyncState } from "~/types";
import type { FarmCrop, YieldAnalytics } from "~/types/crop";
import type { WorkTask } from "~/types/task";
import { cropService, yieldService } from "~/services/crop.service";
import { taskService } from "~/services/task.service";
import { getAuthToken } from "~/services/authToken";
import { buildDashboardAnalytics } from "~/utils/dashboardAnalytics";
import { yieldHeroImage, emptyCropImage } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Yield Analytics" });

const { isReady } = useAuth();
const toast = useToast();

const analytics = ref<YieldAnalytics | null>(null);
const farmCrops = ref<FarmCrop[]>([]);
const farmTasks = ref<WorkTask[]>([]);
const state = ref<AsyncState>("idle");
const fetchError = ref("");
const refreshing = ref(false);

const filters = reactive({
  crop: "",
  field: "",
  season: "",
  year: "",
});

const isInitialLoad = computed(
  () => !isReady.value || (state.value === "loading" && !analytics.value),
);
const summary = computed(() => analytics.value!.summary);

const hasYieldTrend = computed(
  () => (analytics.value?.charts.overTime.length || 0) >= 2,
);

const cropAnalytics = computed(() => {
  if (!analytics.value || !farmCrops.value.length) return null;
  const built = buildDashboardAnalytics(
    farmCrops.value,
    analytics.value,
    farmCrops.value.map((c) => ({
      id: c.id,
      cropName: c.name,
      fieldName: c.fieldName,
      variety: c.variety || "-",
      areaHa: c.areaHa,
      status: c.healthStatus,
      healthScore: c.healthScore,
      stage: c.growthStage,
      plantingDate: c.plantingDate,
      estimatedHarvestDate: c.expectedHarvestDate,
      lastUpdated: c.updatedAt,
    })),
    farmTasks.value,
  );
  return {
    healthDistribution: built.healthDistribution,
    healthByCrop: built.healthByCrop,
    cropAreaSlices: built.cropDistribution.map((c, i) => ({
      label: c.label,
      value: c.value,
      color: ["#16a34a", "#2563eb", "#d97706", "#7c3aed"][i % 4],
    })),
  };
});

const taskSlices = computed(() => {
  if (!farmTasks.value.length) return [];
  const counts = new Map<string, number>();
  for (const t of farmTasks.value) {
    counts.set(t.status, (counts.get(t.status) || 0) + 1);
  }
  const colors: Record<string, string> = {
    pending: "#d97706",
    in_progress: "#2563eb",
    completed: "#16a34a",
    overdue: "#dc2626",
    skipped: "#94a3b8",
  };
  return Array.from(counts.entries()).map(([status, value]) => ({
    label: status.replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase()),
    value,
    color: colors[status] || "#64748b",
  }));
});

const cropOptions = computed(() => [
  { value: "", label: "All crops" },
  ...(analytics.value?.filters.crops || []).map((c) => ({
    value: c,
    label: c,
  })),
]);
const fieldOptions = computed(() => [
  { value: "", label: "All fields" },
  ...(analytics.value?.filters.fields || []).map((f) => ({
    value: f,
    label: f,
  })),
]);
const seasonOptions = computed(() => [
  { value: "", label: "All seasons" },
  ...(analytics.value?.filters.seasons || []).map((s) => ({
    value: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  })),
]);
const yearOptions = computed(() => [
  { value: "", label: "All years" },
  ...(analytics.value?.filters.years || []).map((y) => ({
    value: String(y),
    label: String(y),
  })),
]);

function formatNum(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function formatDiff(n: number) {
  const abs = formatNum(Math.abs(n));
  return n > 0 ? `+${abs}` : n < 0 ? `−${abs}` : "0";
}

function resetFilters() {
  filters.crop = "";
  filters.field = "";
  filters.season = "";
  filters.year = "";
}

async function load() {
  const hasData = Boolean(analytics.value);
  if (hasData) {
    refreshing.value = true;
  } else {
    state.value = "loading";
    fetchError.value = "";
  }
  try {
    const token = await getAuthToken();
    const [yieldData, crops, taskList] = await Promise.all([
      yieldService.analytics(token, {
        crop: filters.crop || undefined,
        field: filters.field || undefined,
        season: filters.season || undefined,
        year: filters.year ? Number(filters.year) : undefined,
      }),
      cropService.list(token),
      taskService.list(token, "all"),
    ]);
    analytics.value = yieldData;
    farmCrops.value = crops;
    farmTasks.value = taskList.tasks;
    state.value = "success";
    fetchError.value = "";
  } catch (err) {
    if (!hasData) {
      state.value = "error";
      fetchError.value =
        err instanceof Error ? err.message : "Unable to load analytics";
    } else {
      toast.error(
        "Could not update yield data",
        err instanceof Error ? err.message : "Try again",
      );
    }
  } finally {
    refreshing.value = false;
  }
}

watch(
  filters,
  () => {
    if (isReady.value) void load();
  },
  { deep: true },
);

useAuthReadyLoad(load);
</script>
