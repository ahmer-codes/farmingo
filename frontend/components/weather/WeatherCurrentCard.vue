<template>
  <WeatherSectionShell as="article" :image-src="weatherSectionImages.current">
    <UiSectionHeader
      eyebrow="Weather"
      title="Current conditions"
      :description="locationLabel"
    />

    <div class="mt-4 flex items-end justify-between gap-4">
      <div>
        <p class="text-4xl font-semibold tabular-nums tracking-tight text-ink">
          {{ formatTemperatureC(current.temperatureC, tempUnit) }}
        </p>
        <p class="mt-1 text-sm font-medium text-ink-secondary">
          {{ current.condition }}
        </p>
        <p class="type-helper mt-1">
          Feels like {{ formatTemperatureC(current.feelsLikeC, tempUnit) }}
        </p>
      </div>
      <div class="text-right type-helper space-y-1">
        <p>High {{ formatTemperatureC(today.highC, tempUnit) }}</p>
        <p>Low {{ formatTemperatureC(today.lowC, tempUnit) }}</p>
      </div>
    </div>

    <dl
      class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:grid-cols-4"
    >
      <div>
        <dt class="type-label">Humidity</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ current.humidityPercent }}%
        </dd>
      </div>
      <div>
        <dt class="type-label">Wind</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ current.windKph }} kph
        </dd>
      </div>
      <div>
        <dt class="type-label">Rain chance</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ current.precipitationProbabilityPercent }}%
        </dd>
      </div>
      <div>
        <dt class="type-label">Rainfall</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ current.rainfallMm }} mm
        </dd>
      </div>
    </dl>

    <dl
      v-if="current.sunrise || current.sunset"
      class="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3"
    >
      <div v-if="current.sunrise">
        <dt class="type-label">Sunrise</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ formatClock(current.sunrise) }}
        </dd>
      </div>
      <div v-if="current.sunset">
        <dt class="type-label">Sunset</dt>
        <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
          {{ formatClock(current.sunset) }}
        </dd>
      </div>
    </dl>

    <div v-if="hourly.length" class="mt-4 border-t border-line pt-4">
      <p class="type-label mb-2">Next hours</p>
      <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div
          v-for="slot in hourly.slice(0, 4)"
          :key="slot.time"
          class="min-w-0 rounded-md border border-white/15 bg-white/10 px-2 py-2 text-center backdrop-blur-[1px]"
        >
          <p class="text-[11px] font-medium text-ink-muted">
            {{ formatHour(slot.time) }}
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
      v-if="riskNote"
      class="mt-4 rounded-md border border-amber-300/35 bg-amber-950/45 px-3 py-2 text-xs leading-relaxed text-amber-100 backdrop-blur-[1px]"
    >
      {{ riskNote }}
    </p>

    <p v-if="meta?.stale" class="type-helper mt-3 text-amber-200">
      Showing cached conditions (may be outdated
      <template v-if="meta.rateLimited"> · rate limited</template>).
    </p>
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type {
  WeatherCurrentConditions,
  WeatherHourlyItem,
  WeatherMeta,
  WeatherTodaySummary,
} from "~/types/weather";
import { formatTemperatureC } from "~/utils/units";
import { weatherSectionImages } from "~/utils/cropImages";

const props = defineProps<{
  current: WeatherCurrentConditions;
  today: WeatherTodaySummary;
  locationLabel: string;
  hourly?: WeatherHourlyItem[];
  riskNote?: string;
  meta?: WeatherMeta;
}>();

const { user } = useAuth();
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);
const hourly = computed(() => props.hourly || []);

function formatHour(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function formatClock(iso: string) {
  return formatHour(iso);
}
</script>
