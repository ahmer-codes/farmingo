<template>
  <WeatherSectionShell :image-src="weatherSectionImages.daily">
    <UiSectionHeader
      title="Multi-day forecast"
      description="Plan irrigation, spraying, and harvest windows across the week."
    />

    <ul v-if="items.length" class="mt-4 divide-y divide-white/15">
      <li
        v-for="day in items"
        :key="day.date"
        class="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
      >
        <div class="min-w-[7rem]">
          <p class="text-sm font-semibold text-ink">
            {{ formatDay(day.date) }}
          </p>
          <p class="type-helper mt-0.5">{{ day.condition }}</p>
        </div>
        <div
          class="flex flex-wrap items-center gap-4 text-sm tabular-nums text-ink"
        >
          <p>
            <span class="text-ink-muted">H</span>
            {{ formatTemperatureC(day.highC, tempUnit) }}
            <span class="mx-1 text-ink-muted">/</span>
            <span class="text-ink-muted">L</span>
            {{ formatTemperatureC(day.lowC, tempUnit) }}
          </p>
          <p class="text-ink-secondary">{{ day.precipProbabilityMax }}% rain</p>
          <p class="text-ink-secondary">{{ day.rainfallMm }} mm</p>
          <p v-if="day.windMaxKph != null" class="text-ink-secondary">
            {{ day.windMaxKph }} kph
          </p>
        </div>
        <div
          v-if="day.sunrise || day.sunset"
          class="type-helper w-full sm:w-auto"
        >
          <template v-if="day.sunrise"
            >↑ {{ formatClock(day.sunrise) }}</template
          >
          <template v-if="day.sunrise && day.sunset"> · </template>
          <template v-if="day.sunset">↓ {{ formatClock(day.sunset) }}</template>
        </div>
      </li>
    </ul>

    <UiEmptyState
      v-else
      class="mt-4"
      title="Daily forecast unavailable"
      description="Multi-day outlook will appear when forecast data is available."
    />
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherDailyItem } from "~/types/weather";
import { formatTemperatureC } from "~/utils/units";
import { weatherSectionImages } from "~/utils/cropImages";

defineProps<{ items: WeatherDailyItem[] }>();

const { user } = useAuth();
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);

function formatDay(date: string) {
  try {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  } catch {
    return date;
  }
}

function formatClock(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
</script>
