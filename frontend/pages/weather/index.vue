<template>
  <div class="space-y-6">
    <UiPageHeroBanner
      :image-src="weatherSectionImages.hero"
      title="Weather"
      description="Field conditions, forecast, and crop precautions for your saved farm location."
    />

    <div
      v-if="isInitialLoad"
      class="space-y-6"
      aria-busy="true"
      aria-label="Loading weather"
    >
      <div class="grid gap-4 lg:grid-cols-5">
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
        <div class="space-y-4 lg:col-span-3">
          <div class="surface-card p-4">
            <UiSkeleton height="sm" width="md" />
            <UiSkeleton class="mt-4" height="lg" width="full" />
          </div>
          <div class="surface-card p-4">
            <UiSkeleton height="sm" width="md" />
            <UiSkeleton class="mt-4" height="lg" width="full" />
          </div>
        </div>
      </div>
      <div class="surface-card p-4">
        <UiSkeleton height="sm" width="md" />
        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <UiSkeleton v-for="n in 4" :key="n" height="lg" width="full" />
        </div>
      </div>
    </div>

    <div v-else-if="state === 'error' && !current" class="space-y-3">
      <UiErrorState
        :message="errorMessage"
        :retry-label="canRetry ? 'Try again' : undefined"
        @retry="load()"
      />
      <NuxtLink
        v-if="errorCode === 422"
        to="/profile"
        class="inline-flex text-sm font-semibold text-brand-700 hover:underline"
      >
        Update farm location
      </NuxtLink>
    </div>

    <template v-else-if="current">
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
            Updating weather…
          </span>
        </div>

        <div :class="{ 'opacity-60': refreshing }" class="space-y-6">
          <p
            v-if="current.meta.stale"
            class="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            Showing last known weather
            <template v-if="current.meta.rateLimited">
              (provider rate limited)</template
            >. Updated {{ formatFetched(current.meta.fetchedAt) }}.
          </p>

          <section class="grid gap-4 lg:grid-cols-5">
            <div class="lg:col-span-2">
              <WeatherCurrentCard
                :current="current.current"
                :today="current.today"
                :location-label="locationLabel"
                :hourly="current.hourlyPreview"
                :risk-note="primaryRiskNote"
                :meta="current.meta"
              />
            </div>
            <div class="lg:col-span-3 space-y-4">
              <WeatherRisks :risks="current.risks" />
              <WeatherRecommendations
                :recommendations="current.recommendations"
              />
            </div>
          </section>

          <WeatherHourlyForecast :items="hourlyItems" />
          <WeatherDailyForecast :items="dailyItems" />

          <p class="type-helper">
            Source: {{ current.meta.provider }} · Fetched
            {{ formatFetched(current.meta.fetchedAt) }} · Cache expires
            {{ formatFetched(current.meta.expiresAt) }}
          </p>
        </div>
      </div>
    </template>

    <UiEmptyState
      v-else
      title="Weather unavailable"
      description="No weather data could be loaded for this farm."
    />
  </div>
</template>

<script setup lang="ts">
import { weatherSectionImages } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Weather" });

const {
  current,
  forecast,
  state,
  error,
  errorCode,
  refreshing,
  isInitialLoad,
  load,
} = useWeather();

const locationLabel = computed(() => {
  if (!current.value) return "";
  const loc = current.value.location;
  const bits = [loc.farmLocation || loc.label, loc.region].filter(Boolean);
  return bits.join(", ");
});

const hourlyItems = computed(
  () => forecast.value?.hourly || current.value?.hourlyPreview || [],
);
const dailyItems = computed(() => forecast.value?.daily || []);

const primaryRiskNote = computed(() => {
  const top = current.value?.risks[0];
  return top ? `${top.label}: ${top.detail}` : undefined;
});

const canRetry = computed(
  () => errorCode.value !== 401 && errorCode.value !== 422,
);

const errorMessage = computed(() => {
  if (errorCode.value === 429) {
    return (
      error.value ||
      "Weather rate limit reached. Please try again in a few minutes."
    );
  }
  if (errorCode.value === 422) {
    return error.value || "Farm location is missing or could not be resolved.";
  }
  return error.value || "Unable to load weather";
});

function formatFetched(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

useAuthReadyLoad(() => load({ includeForecast: true }));
</script>
