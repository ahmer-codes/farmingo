<template>
  <WeatherSectionShell :image-src="weatherSectionImages.risks">
    <UiSectionHeader
      title="Weather risks"
      description="Threshold-based risks for your farm location and crops."
    />

    <ul v-if="risks.length" class="mt-4 space-y-2">
      <li
        v-for="risk in risks"
        :key="risk.id"
        class="flex items-start gap-3 rounded-md border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-[1px]"
      >
        <UiStatusBadge
          :tone="weatherSeverityTone(risk.severity)"
          class="shrink-0"
        >
          {{ weatherSeverityLabel(risk.severity) }}
        </UiStatusBadge>
        <div>
          <p class="text-sm font-semibold text-ink">{{ risk.label }}</p>
          <p class="type-helper mt-1">{{ risk.detail }}</p>
        </div>
      </li>
    </ul>

    <UiEmptyState
      v-else
      class="mt-4"
      title="No elevated weather risks"
      description="Conditions are within the rule thresholds for your active crops."
    />
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherRisk } from "~/types/weather";
import { weatherSeverityLabel, weatherSeverityTone } from "~/types/weather";
import { weatherSectionImages } from "~/utils/cropImages";

defineProps<{ risks: WeatherRisk[] }>();
</script>
