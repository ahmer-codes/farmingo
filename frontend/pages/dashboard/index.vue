<template>
  <div class="space-y-6">
    <UiErrorState
      v-if="state === 'error' && !data"
      :message="error || 'Unable to load dashboard'"
      retry-label="Try again"
      @retry="load"
    />

    <!-- Initial load skeleton -->
    <div
      v-else-if="isInitialLoad"
      class="space-y-6"
      aria-busy="true"
      aria-label="Loading dashboard"
    >
      <header
        class="flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="min-w-0 flex-1 space-y-2">
          <UiSkeleton height="xs" width="sm" />
          <UiSkeleton height="xl" width="md" />
          <UiSkeleton height="sm" width="lg" />
        </div>
        <div class="flex flex-wrap gap-2">
          <UiSkeleton height="lg" width="sm" class="!w-36" />
          <UiSkeleton height="lg" width="sm" class="!w-32" />
        </div>
      </header>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <UiStatCardSkeleton v-for="n in 5" :key="n" />
      </div>

      <section class="grid gap-4 lg:grid-cols-5">
        <div class="surface-card p-4 lg:col-span-2">
          <UiSkeleton height="sm" width="md" />
          <UiSkeleton class="mt-4 !w-24" height="xl" width="xs" />
          <UiSkeleton class="mt-3" height="sm" width="sm" />
          <div
            class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4"
          >
            <UiSkeleton v-for="n in 4" :key="n" height="md" width="full" />
          </div>
        </div>
        <div class="surface-card p-4 lg:col-span-3">
          <UiSkeleton height="sm" width="md" />
          <div class="mt-4 space-y-3">
            <UiSkeleton v-for="n in 2" :key="n" height="lg" width="full" />
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <UiSkeleton height="sm" width="md" />
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <UiStatCardSkeleton v-for="n in 4" :key="n" />
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="surface-card p-4">
          <UiSkeleton height="sm" width="md" />
          <div class="mt-4 space-y-2">
            <UiTableRowSkeleton v-for="n in 3" :key="n" compact />
          </div>
        </div>
        <div class="surface-card p-4">
          <UiSkeleton height="sm" width="md" />
          <UiSkeleton class="mt-4" height="xl" width="full" />
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <div class="surface-card p-4">
          <UiSkeleton height="sm" width="md" />
          <UiSkeleton class="mt-4" height="lg" width="full" />
        </div>
        <div class="surface-card p-4">
          <UiSkeleton height="sm" width="md" />
          <div class="mt-4 space-y-3">
            <UiSkeleton v-for="n in 3" :key="n" height="md" width="full" />
          </div>
        </div>
      </section>
    </div>

    <template v-else-if="data">
      <div class="relative space-y-6">
        <div
          v-if="refreshing"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
          aria-hidden="true"
        >
          <span
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-secondary shadow-card"
          >
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
            />
            Updating…
          </span>
        </div>

        <DashboardHeroBanner
          :greeting="heroGreeting"
          :farm-name="displayFarmName"
          :location="displayLocation"
          :date-label="todayLabel"
          :stats="heroStats"
        />

        <DashboardOverviewMetrics :overview="data.overview" />

        <DashboardAnalyticsSection :analytics="data.analytics" />

        <section class="grid gap-4 lg:grid-cols-5">
          <div class="lg:col-span-2">
            <DashboardWeatherCard
              :weather="data.weather"
              :weather-error="data.weatherError"
              :weather-status="data.weatherStatus"
              :weather-stale="Boolean(data.weather?.stale)"
              :location-fallback="displayLocation"
              :refreshing="weatherRefreshing"
              @refresh="refreshWeather"
            />
          </div>
          <div class="lg:col-span-3">
            <DashboardRecommendedActions :actions="data.recommendedActions" />
          </div>
        </section>

        <DashboardCropHealth :crops="data.crops" />

        <section class="grid gap-4 lg:grid-cols-2">
          <DashboardTasksPanel :tasks="data.tasks" />
          <DashboardYieldPanel :series="data.yieldSeries" />
        </section>

        <section class="grid gap-4 lg:grid-cols-2">
          <DashboardAlertsPanel :alerts="data.alerts" />
          <DashboardRecentActivity :items="data.recentActivity" />
        </section>
      </div>
    </template>

    <UiEmptyState
      v-else-if="state === 'empty'"
      title="Dashboard unavailable"
      description="Farm overview data could not be loaded."
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: "auth" });
useHead({ title: "Dashboard" });

const { displayName, farm } = useAuth();
const toast = useToast();
const {
  data,
  state,
  error,
  refreshing,
  weatherRefreshing,
  isInitialLoad,
  load,
  refreshWeather,
} = useDashboard();

onActivated(() => {
  void load();
});

watch(refreshing, (isRefreshing, wasRefreshing) => {
  if (wasRefreshing && !isRefreshing && data.value && error.value) {
    toast.error(
      "Couldn't refresh dashboard. Showing the latest available data.",
      error.value,
    );
  }
});

const farmerName = computed(() => displayName.value);
const displayFarmName = computed(
  () => farm.value?.name || data.value?.farm.farmName || "Your farm",
);
const displayLocation = computed(() => {
  if (farm.value?.location) {
    return `${farm.value.location}${farm.value.region ? `, ${farm.value.region}` : ""}`;
  }
  return data.value?.farm.location || "Location not set";
});

const todayLabel = computed(() =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }),
);

const heroGreeting = computed(() => {
  const hour = new Date().getHours();
  const name = farmerName.value.split(" ")[0] || "Farmer";
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  return `Good evening, ${name}`;
});

const heroStats = computed(() => {
  if (!data.value) return undefined;
  const pending = Number(data.value.overview.pendingTasks.value) || 0;
  return {
    activeCrops: data.value.crops.length,
    averageHealth: data.value.analytics.averageHealthScore,
    yieldAchievement: data.value.analytics.yieldSummary.achievementPercent,
    openTasks: pending,
  };
});

useAuthReadyLoad(() => load());
</script>
