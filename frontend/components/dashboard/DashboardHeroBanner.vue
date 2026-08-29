<template>
  <section
    class="relative overflow-hidden rounded-md border border-line bg-brand-900 text-white shadow-card"
  >
    <img
      :src="dashboardHeroImage"
      alt=""
      class="absolute inset-0 h-full w-full object-cover opacity-35"
      loading="lazy"
    />
    <div
      class="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/80 to-brand-800/60"
    />

    <div
      class="relative flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between"
    >
      <div class="min-w-0">
        <p class="text-sm font-medium text-brand-100">{{ greeting }}</p>
        <h2 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {{ farmName }}
        </h2>
        <p class="mt-1 text-sm text-brand-100/90">
          {{ location }} · {{ dateLabel }}
        </p>
        <dl v-if="stats" class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <dt class="text-xs text-brand-200">Active crops</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {{ stats.activeCrops }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-brand-200">Avg health</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {{ stats.averageHealth }}%
            </dd>
          </div>
          <div>
            <dt class="text-xs text-brand-200">Yield achievement</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {{ stats.yieldAchievement }}%
            </dd>
          </div>
          <div>
            <dt class="text-xs text-brand-200">Open tasks</dt>
            <dd class="text-lg font-semibold tabular-nums">
              {{ stats.openTasks }}
            </dd>
          </div>
        </dl>
      </div>

      <div class="flex shrink-0 flex-wrap gap-2">
        <UiAppButton
          variant="secondary"
          size="sm"
          @click="navigateTo('/disease-detection')"
        >
          Assess crop health
        </UiAppButton>
        <UiAppButton
          variant="ghost"
          size="sm"
          class="!text-white hover:!bg-white/10"
          @click="navigateTo('/yield')"
        >
          View analytics
        </UiAppButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { dashboardHeroImage } from "~/utils/cropImages";

defineProps<{
  greeting: string;
  farmName: string;
  location: string;
  dateLabel: string;
  stats?: {
    activeCrops: number;
    averageHealth: number;
    yieldAchievement: number;
    openTasks: number;
  };
}>();
</script>
