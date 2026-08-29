<template>
  <section class="space-y-3">
    <UiSectionHeader
      title="Crop health"
      description="Active crops, field status, and harvest windows."
      bordered
    >
      <template #action>
        <NuxtLink
          to="/crops"
          class="text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          View all
        </NuxtLink>
      </template>
    </UiSectionHeader>

    <div v-if="crops.length" class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="crop in crops"
        :key="crop.id"
        class="surface-card overflow-hidden"
      >
        <div class="relative h-20">
          <img
            :src="cropImageFor(crop.cropName)"
            alt=""
            class="h-full w-full object-cover"
            loading="lazy"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
          />
          <UiStatusBadge
            class="absolute right-2 top-2"
            :tone="statusTone(crop.status)"
            dot
            compact
          >
            {{ healthStatusShortLabel(crop.status) }}
          </UiStatusBadge>
        </div>
        <div class="p-4">
          <h3 class="type-card-title">{{ crop.cropName }}</h3>
          <p class="type-helper mt-0.5">
            {{ crop.fieldName }} · {{ crop.areaHa }} {{ areaUnit }}
          </p>

          <div class="mt-3">
            <UiProgressIndicator
              :value="crop.healthScore"
              label="Health score"
              :tone="progressTone(crop.healthScore)"
            />
          </div>

          <dl class="mt-4 space-y-2 border-t border-line pt-3 text-sm">
            <div class="flex justify-between gap-3">
              <dt class="text-ink-muted">Growth stage</dt>
              <dd class="font-medium text-ink">{{ crop.stage }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-ink-muted">Planted</dt>
              <dd class="font-medium text-ink">{{ crop.plantingDate }}</dd>
            </div>
            <div class="flex justify-between gap-3">
              <dt class="text-ink-muted">Est. harvest</dt>
              <dd class="font-medium text-ink">
                {{ crop.estimatedHarvestDate }}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </div>

    <UiEmptyState
      v-else
      title="No active crops"
      description="Add crop records on the Crops page to track field health here."
      :image-src="emptyCropImage"
    >
      <template #action>
        <NuxtLink
          to="/crops"
          class="inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:brightness-95"
        >
          <UiAppIcon name="plus" size="sm" />
          Add crop
        </NuxtLink>
      </template>
    </UiEmptyState>
  </section>
</template>

<script setup lang="ts">
import type { CropHealthItem, HealthStatus } from "~/types";
import { healthStatusShortLabel } from "~/types/dashboard";
import { cropImageFor, emptyCropImage } from "~/utils/cropImages";

defineProps<{ crops: CropHealthItem[] }>();

const { user } = useAuth();
const areaUnit = computed(() =>
  user.value?.preferences.landUnit === "acres" ? "ac" : "ha",
);

function statusTone(status: HealthStatus) {
  if (status === "healthy") return "success" as const;
  if (status === "critical") return "danger" as const;
  return "warning" as const;
}

function progressTone(score: number) {
  if (score >= 80) return "success" as const;
  if (score >= 65) return "warning" as const;
  return "danger" as const;
}
</script>
