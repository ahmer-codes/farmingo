<template>
  <WeatherSectionShell as="article" variant="plain">
    <UiSectionHeader
      eyebrow="Field conditions"
      title="Weather now"
      :description="weather.location"
    />

    <div class="mt-4 flex items-end justify-between gap-4">
      <div>
        <p class="text-4xl font-semibold tabular-nums tracking-tight text-ink">
          {{ formatTemperatureC(weather.temperatureC, tempUnit) }}
        </p>
        <p class="mt-1 text-sm font-medium text-ink-secondary">
          {{ weather.condition }}
        </p>
      </div>
      <div class="text-right type-helper space-y-1">
        <p>
          H {{ formatTemperatureC(weather.forecastHighC, tempUnit) }} · L
          {{ formatTemperatureC(weather.forecastLowC, tempUnit) }}
        </p>
        <p>Wind {{ weather.windKph }} km/h</p>
      </div>
    </div>

    <dl class="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4">
      <div>
        <dt class="type-label">Humidity</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ weather.humidityPercent }}%
        </dd>
      </div>
      <div>
        <dt class="type-label">Rain</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ weather.rainfallMm }} mm
        </dd>
      </div>
      <div>
        <dt class="type-label">Wind</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ weather.windKph }} kph
        </dd>
      </div>
    </dl>

    <p
      v-if="weather.riskNote"
      class="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800"
    >
      {{ weather.riskNote }}
    </p>
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherSnapshot } from "~/types";
import { formatTemperatureC } from "~/utils/units";

defineProps<{ weather: WeatherSnapshot }>();

const { user } = useAuth();
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);
</script>
