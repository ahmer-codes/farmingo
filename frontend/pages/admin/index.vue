<template>
  <div class="space-y-3 md:space-y-6">
    <header
      class="flex flex-col gap-2 md:gap-4 lg:flex-row lg:items-end lg:justify-between"
    >
      <div>
        <h1 class="text-xl font-semibold text-ink md:text-2xl">
          Analytics dashboard
        </h1>
        <p class="type-helper mt-0.5 max-w-3xl md:mt-1">
          Platform-wide metrics from Firestore, live counts and aggregations.
        </p>
      </div>

      <div
        class="admin-dashboard-range -mx-0.5 flex gap-2 overflow-x-auto px-0.5 pb-0.5"
        role="group"
        aria-label="Dashboard date range"
      >
        <button
          v-for="option in DASHBOARD_RANGE_OPTIONS"
          :key="option.value"
          type="button"
          class="shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition"
          :class="
            selectedRange === option.value
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-line bg-white text-ink-secondary hover:border-brand-200 hover:text-ink'
          "
          :disabled="loading"
          @click="setRange(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </header>

    <div
      v-if="dashboard?.meta.truncated"
      class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="status"
    >
      Some time-series queries hit safety limits and may not include every
      record in the selected range. KPI totals still use full collection counts.
    </div>

    <AdminAdminDashboardSkeleton v-if="loading" />
    <UiErrorState
      v-else-if="error"
      :message="error"
      retry-label="Retry"
      @retry="load"
    />

    <template v-else-if="dashboard">
      <div class="flex flex-col gap-3 md:gap-6">
        <section
          class="order-2 lg:order-1"
          aria-label="Key performance indicators"
        >
          <div
            class="admin-dashboard-kpis grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8"
          >
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Total users"
              :value="formatNumber(dashboard.kpis.totalUsers)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Active today"
              :value="formatNumber(dashboard.kpis.activeToday)"
              helper="lastActiveAt since midnight"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Active last 7 days"
              :value="formatNumber(dashboard.kpis.activeLast7Days)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Total farms"
              :value="formatNumber(dashboard.kpis.totalFarms)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Total crops"
              :value="formatNumber(dashboard.kpis.totalCrops)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Open tasks"
              :value="formatNumber(dashboard.kpis.openTasks)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Disease assessments"
              :value="formatNumber(dashboard.kpis.diseaseAssessments)"
            />
            <AdminAdminStatCard
              class="admin-dashboard-kpi-card"
              label="Open support chats"
              :value="formatNumber(dashboard.kpis.openSupportConversations)"
            />
          </div>
        </section>

        <div class="order-1 flex flex-col gap-3 md:gap-6 lg:order-2">
          <section
            class="grid min-w-0 gap-4 xl:grid-cols-2"
            aria-label="Growth and yield trends"
          >
            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="User growth"
                description="New user registrations by month in the selected range"
              />
              <ChartsLineAreaChart
                embedded
                title="User growth"
                series-label="Registrations"
                :points="userGrowthPoints"
                empty-message="Not enough registrations in this range yet."
              />
            </article>

            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Expected vs actual yield"
                description="Sum of yieldRecords expected and actual values by month"
              />
              <ChartsBarCompareChart
                embedded
                title="Expected vs actual yield"
                :points="yieldTrendPoints"
                empty-message="No yield records in this range yet."
              />
            </article>
          </section>

          <section
            class="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3"
            aria-label="Distribution charts"
          >
            <article
              v-for="(chart, index) in distributionCharts"
              :key="chart.title"
              class="surface-card min-w-0 overflow-hidden p-4"
              :class="index === 2 ? 'lg:col-span-2 xl:col-span-1' : ''"
            >
              <UiSectionHeader
                :title="chart.title"
                :description="chart.description"
              />
              <ChartsDonutChart
                embedded
                :title="chart.title"
                :slices="withColors(chart.slices)"
                :empty-message="chart.emptyMessage"
              />
            </article>
          </section>

          <section
            class="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-3"
            aria-label="Disease analytics"
          >
            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Disease assessments over time"
                description="Assessments created per month in the selected range"
              />
              <ChartsLineAreaChart
                embedded
                title="Disease assessments"
                series-label="Assessments"
                :points="diseaseOverTimePoints"
                empty-message="Not enough disease assessments in this range yet."
              />
            </article>

            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Disease by type"
                description="Top diseases in the selected range"
              />
              <ChartsHorizontalBarChart
                embedded
                title="Disease by type"
                :items="dashboard.analytics.diseaseByDisease"
                empty-message="Not enough disease assessments in this range yet."
              />
            </article>

            <article
              class="surface-card min-w-0 overflow-hidden p-4 lg:col-span-2 xl:col-span-1"
            >
              <UiSectionHeader
                title="Disease by crop"
                description="Assessments grouped by crop name"
              />
              <ChartsHorizontalBarChart
                embedded
                title="Disease by crop"
                :items="dashboard.analytics.diseaseByCrop"
                empty-message="Not enough disease assessments in this range yet."
              />
            </article>
          </section>

          <section
            class="grid min-w-0 gap-4 lg:grid-cols-2 xl:grid-cols-4"
            aria-label="Operations analytics"
          >
            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Farm size distribution"
                description="Farms bucketed by stored size value"
              />
              <ChartsDonutChart
                embedded
                title="Farm sizes"
                :slices="withColors(dashboard.analytics.farmSizeDistribution)"
                empty-message="No farms recorded yet."
              />
            </article>

            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Support activity"
                description="New vs resolved conversations by month. Active = conversations with lastMessageAt in month."
              />
              <ChartsBarCompareChart
                embedded
                title="Support activity"
                left-legend="New conversations"
                right-legend="Resolved"
                :points="supportActivityPoints"
                empty-message="No support conversation activity in this range yet."
              />
            </article>

            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Treatment plans"
                description="Treatment plans created per month (plans do not store completion status)"
              />
              <ChartsLineAreaChart
                embedded
                title="Treatment plans"
                series-label="Plans created"
                :points="treatmentPlanPoints"
                empty-message="Not enough treatment plans in this range yet."
              />
            </article>

            <article class="surface-card min-w-0 overflow-hidden p-4">
              <UiSectionHeader
                title="Yield performance by crop"
                description="Actual vs expected achievement % from yieldRecords in range"
              />
              <ChartsHorizontalBarChart
                embedded
                title="Yield performance"
                :items="yieldPerformanceItems"
                value-suffix="%"
                empty-message="Not enough yield records to calculate performance by crop."
              />
            </article>
          </section>

          <footer class="border-t border-line pt-4">
            <p class="type-helper">
              Range: {{ rangeLabel }} · Updated
              {{ formatTimestamp(dashboard.meta.rangeEnd) }}
            </p>
          </footer>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import {
  ADMIN_CHART_COLORS,
  DASHBOARD_RANGE_OPTIONS,
  type AdminDashboardResponse,
  type DashboardRange,
} from "~/types/admin";
import { adminService } from "~/services/admin.service";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Admin Analytics Dashboard" });

const loading = ref(true);
const error = ref("");
const dashboard = ref<AdminDashboardResponse | null>(null);
const selectedRange = ref<DashboardRange>("180d");

const rangeLabel = computed(
  () =>
    DASHBOARD_RANGE_OPTIONS.find((o) => o.value === selectedRange.value)
      ?.label || "6 months",
);

const userGrowthPoints = computed(() =>
  (dashboard.value?.analytics.userGrowth || []).map((row) => ({
    label: formatMonth(row.month),
    value: row.count,
  })),
);

const yieldTrendPoints = computed(() =>
  (dashboard.value?.analytics.yieldTrend || []).map((row) => ({
    label: formatMonth(row.month),
    expected: row.expected,
    actual: row.actual,
  })),
);

const diseaseOverTimePoints = computed(() =>
  (dashboard.value?.analytics.diseaseOverTime || []).map((row) => ({
    label: formatMonth(row.month),
    value: row.count,
  })),
);

const supportActivityPoints = computed(() =>
  (dashboard.value?.analytics.supportActivity || [])
    .filter((row) => row.newConversations > 0 || row.resolvedConversations > 0)
    .map((row) => ({
      label: formatMonth(row.month),
      expected: row.newConversations,
      actual: row.resolvedConversations,
    })),
);

const treatmentPlanPoints = computed(() =>
  (dashboard.value?.analytics.treatmentPlansOverTime || []).map((row) => ({
    label: formatMonth(row.month),
    value: row.count,
  })),
);

const yieldPerformanceItems = computed(() =>
  (dashboard.value?.analytics.yieldPerformanceByCrop || [])
    .filter((row) => row.achievementPercent != null)
    .map((row) => ({
      label: row.label,
      value: row.achievementPercent as number,
    })),
);

const distributionCharts = computed(() => {
  if (!dashboard.value) return [];
  return [
    {
      title: "Crop distribution",
      description: "Registered crops by crop name",
      slices: dashboard.value.analytics.cropDistribution,
      emptyMessage: "No crops recorded yet.",
    },
    {
      title: "Crop health distribution",
      description: "Current crop records grouped by healthStatus",
      slices: dashboard.value.analytics.cropHealthDistribution,
      emptyMessage: "No crop health data yet.",
    },
    {
      title: "Task status",
      description: "All tasks by status (platform-wide counts)",
      slices: dashboard.value.analytics.taskStatus,
      emptyMessage: "No tasks recorded yet.",
    },
  ];
});

function formatNumber(value: number) {
  return value.toLocaleString();
}

function formatMonth(month: string) {
  const [year, mon] = month.split("-");
  const date = new Date(Number(year), Number(mon) - 1, 1);
  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString();
}

function withColors(items: Array<{ label: string; value: number }>) {
  return items.map((item, index) => ({
    ...item,
    color: ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length],
  }));
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    dashboard.value = await adminService.dashboard(selectedRange.value);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to load dashboard";
  } finally {
    loading.value = false;
  }
}

function setRange(range: DashboardRange) {
  if (selectedRange.value === range) return;
  selectedRange.value = range;
  void load();
}

onMounted(load);
</script>

<style scoped>
.admin-dashboard-range {
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.admin-dashboard-range::-webkit-scrollbar {
  height: 4px;
}

.admin-dashboard-range::-webkit-scrollbar-thumb {
  background: rgba(26, 77, 46, 0.35);
  border-radius: 999px;
}

@media (max-width: 639px) {
  .admin-dashboard-kpis {
    display: flex;
    gap: 0.625rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
    scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }

  .admin-dashboard-kpi-card {
    width: min(72vw, 10.5rem);
    flex-shrink: 0;
  }

  .admin-dashboard-kpis::-webkit-scrollbar {
    height: 4px;
  }

  .admin-dashboard-kpis::-webkit-scrollbar-thumb {
    background: rgba(26, 77, 46, 0.35);
    border-radius: 999px;
  }
}
</style>
