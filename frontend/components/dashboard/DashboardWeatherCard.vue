<template>
  <WeatherSectionShell as="article" variant="plain">
    <UiSectionHeader
      eyebrow="Weather"
      title="Field conditions"
      :description="weather?.location || locationFallback"
    >
      <template #action>
        <UiAppIconButton
          icon="refresh-cw"
          aria-label="Reload weather"
          title="Reload weather"
          size="md"
          :loading="refreshing"
          @click="$emit('refresh')"
        />
      </template>
    </UiSectionHeader>

    <div v-if="weatherLoading" class="mt-4 space-y-3" aria-busy="true">
      <UiSkeleton height="xl" width="xs" class="!w-24" />
      <UiSkeleton height="sm" width="sm" />
      <div
        class="grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4"
      >
        <UiSkeleton v-for="n in 4" :key="n" height="md" width="full" />
      </div>
    </div>

    <div
      v-else-if="!weather"
      class="mt-4 rounded-md border border-line bg-canvas px-4 py-6 text-center"
    >
      <p
        class="flex items-center justify-center gap-2 text-sm font-medium text-ink-secondary"
      >
        <UiAppIcon
          name="alert-triangle"
          class="h-4 w-4 shrink-0 text-warning"
        />
        {{ unavailableMessage }}
      </p>
      <NuxtLink
        v-if="showLocationLink"
        to="/profile"
        class="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:underline"
      >
        Update farm location
      </NuxtLink>
    </div>

    <template v-else>
      <p
        v-if="weather.stale || weatherStale"
        class="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
      >
        Showing last known weather
        <template v-if="weather.rateLimited"> (provider rate limited)</template
        >.
      </p>

      <div class="mt-4 flex items-end justify-between gap-4">
        <div>
          <p
            class="text-4xl font-semibold tabular-nums tracking-tight text-ink"
          >
            {{ formatTemperatureC(weather.temperatureC, tempUnit) }}
          </p>
          <p class="mt-1 text-sm font-medium text-ink-secondary">
            {{ weather.condition }}
          </p>
          <p class="type-helper mt-1">
            Feels like {{ formatTemperatureC(weather.feelsLikeC, tempUnit) }}
          </p>
        </div>
        <div class="text-right type-helper space-y-1">
          <p>High {{ formatTemperatureC(weather.forecastHighC, tempUnit) }}</p>
          <p>Low {{ formatTemperatureC(weather.forecastLowC, tempUnit) }}</p>
        </div>
      </div>

      <dl
        class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4"
      >
        <div>
          <dt class="type-label">Humidity</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ weather.humidityPercent }}%
          </dd>
        </div>
        <div>
          <dt class="type-label">Wind</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ weather.windKph }} kph
          </dd>
        </div>
        <div>
          <dt class="type-label">Rain chance</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ weather.rainProbabilityPercent }}%
          </dd>
        </div>
        <div>
          <dt class="type-label">Rainfall</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ weather.rainfallMm }} mm
          </dd>
        </div>
      </dl>

      <div
        v-if="weather.todayForecast.length"
        class="mt-4 border-t border-line pt-4"
      >
        <p class="type-label mb-2">Today’s forecast</p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div
            v-for="slot in weather.todayForecast"
            :key="slot.time"
            class="min-w-0 rounded-md bg-canvas px-2 py-2 text-center"
          >
            <p class="text-[11px] font-medium text-ink-muted">
              {{ slot.time }}
            </p>
            <p class="mt-1 text-sm font-semibold tabular-nums text-ink">
              {{ formatTemperatureC(slot.temperatureC, tempUnit) }}
            </p>
            <p
              class="mt-0.5 break-words text-[11px] leading-snug text-ink-muted sm:truncate sm:text-[10px]"
            >
              {{ slot.condition }}
            </p>
          </div>
        </div>
      </div>

      <p
        v-if="weather.riskNote"
        class="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
      >
        {{ weather.riskNote }}
      </p>
    </template>
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherSnapshot } from "~/types";
import { formatTemperatureC } from "~/utils/units";

const props = defineProps<{
  weather: WeatherSnapshot | null;
  weatherError?: string | null;
  weatherStatus?: "idle" | "loading" | "success" | "error" | "unavailable";
  weatherStale?: boolean;
  locationFallback?: string;
  refreshing?: boolean;
}>();

defineEmits<{ refresh: [] }>();

const { user } = useAuth();
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);

const weatherLoading = computed(
  () => props.weatherStatus === "loading" && !props.weather,
);

const unavailableMessage = computed(
  () => props.weatherError || "Weather unavailable for your farm location.",
);

const showLocationLink = computed(() =>
  Boolean(
    props.weatherError &&
      (props.weatherError.toLowerCase().includes("location") ||
        props.weatherError.toLowerCase().includes("resolve")),
  ),
);
</script>
