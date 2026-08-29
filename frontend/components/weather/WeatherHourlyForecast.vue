<template>
  <WeatherSectionShell :image-src="weatherSectionImages.hourly">
    <UiSectionHeader
      title="Hourly forecast"
      description="Temperature, rain chance, and wind for field planning."
    />

    <div v-if="items.length" class="mt-4 -mx-1 overflow-x-auto">
      <div class="flex min-w-max gap-2 px-1 pb-1">
        <div
          v-for="item in items"
          :key="item.time"
          class="w-[4.75rem] shrink-0 rounded-md border border-white/15 bg-white/10 px-2 py-2.5 text-center backdrop-blur-[1px]"
        >
          <p class="text-[11px] font-medium text-ink-muted">
            {{ formatHour(item.time) }}
          </p>
          <p class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ formatTemperatureC(item.temperatureC, tempUnit) }}
          </p>
          <p class="mt-1 truncate text-[10px] text-ink-secondary">
            {{ item.condition }}
          </p>
          <p class="mt-1 text-[10px] tabular-nums text-ink-muted">
            {{ item.precipitationProbabilityPercent }}%
          </p>
          <p
            v-if="item.windKph != null"
            class="mt-0.5 text-[10px] tabular-nums text-ink-muted"
          >
            {{ item.windKph }} kph
          </p>
        </div>
      </div>
    </div>

    <UiEmptyState
      v-else
      class="mt-4"
      title="Hourly forecast unavailable"
      description="Hourly details will appear when the weather provider returns them."
    />
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherHourlyItem } from "~/types/weather";
import { formatTemperatureC } from "~/utils/units";
import { weatherSectionImages } from "~/utils/cropImages";

defineProps<{ items: WeatherHourlyItem[] }>();

const { user } = useAuth();
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);

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
</script>
