<template>
  <WeatherSectionShell :image-src="weatherSectionImages.recommendations">
    <UiSectionHeader
      title="Weather-based recommendations"
      description="Rule-based precautions from current conditions, your crops, growth stage, and season."
    />

    <ul v-if="recommendations.length" class="mt-4 space-y-3">
      <li
        v-for="item in recommendations"
        :key="item.id"
        class="rounded-md border px-3.5 py-3"
        :class="severityShell(item.severity)"
      >
        <div class="flex flex-wrap items-center gap-2">
          <UiStatusBadge :tone="weatherSeverityTone(item.severity)">
            {{ weatherSeverityLabel(item.severity) }}
          </UiStatusBadge>
          <h3 class="type-card-title">{{ item.title }}</h3>
        </div>
        <p class="type-body mt-2">{{ item.description }}</p>
        <p class="mt-2 text-sm font-medium text-ink">
          {{ item.recommendedAction }}
        </p>
        <p class="type-helper mt-2">
          {{ item.reason }}
          <template v-if="item.cropType">
            · {{ item.cropType }}
            <template v-if="item.growthStage">
              ({{ formatStage(item.growthStage) }})</template
            >
            <template v-if="item.season"> · {{ item.season }}</template>
          </template>
        </p>
        <p class="type-helper mt-1">
          Valid until {{ formatValidUntil(item.validUntil) }}
        </p>
      </li>
    </ul>

    <UiEmptyState
      v-else
      class="mt-4"
      title="No weather precautions right now"
      description="When conditions cross crop risk thresholds, recommendations will appear here with clear reasons."
    />
  </WeatherSectionShell>
</template>

<script setup lang="ts">
import type { WeatherRecommendation, WeatherSeverity } from "~/types/weather";
import { weatherSeverityLabel, weatherSeverityTone } from "~/types/weather";
import { weatherSectionImages } from "~/utils/cropImages";

defineProps<{ recommendations: WeatherRecommendation[] }>();

function formatStage(stage: string) {
  return stage
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatValidUntil(iso: string) {
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

function severityShell(severity: WeatherSeverity) {
  if (severity === "critical")
    return "border-red-300/35 bg-red-950/45 backdrop-blur-[1px]";
  if (severity === "warning")
    return "border-amber-300/35 bg-amber-950/40 backdrop-blur-[1px]";
  if (severity === "watch")
    return "border-amber-200/30 bg-amber-950/30 backdrop-blur-[1px]";
  return "border-white/15 bg-white/10 backdrop-blur-[1px]";
}
</script>
