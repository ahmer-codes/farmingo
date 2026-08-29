<template>
  <article class="surface-card p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="type-card-title">{{ crop.cropName }}</h3>
        <p class="type-helper mt-0.5">
          {{ crop.fieldName }} · {{ crop.variety }}
        </p>
      </div>
      <UiStatusBadge :tone="statusTone" dot>{{ statusLabel }}</UiStatusBadge>
    </div>

    <div class="mt-4">
      <UiProgressIndicator
        :value="crop.healthScore"
        label="Health score"
        :tone="progressTone"
      />
    </div>

    <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3">
      <div>
        <dt class="type-label">Growth stage</dt>
        <dd class="mt-1 text-sm font-medium text-ink">{{ crop.stage }}</dd>
      </div>
      <div>
        <dt class="type-label">Area</dt>
        <dd class="mt-1 text-sm font-medium tabular-nums text-ink">
          {{ crop.areaHa }} ha
        </dd>
      </div>
      <div class="col-span-2">
        <dt class="type-label">Last updated</dt>
        <dd class="mt-1 text-sm font-medium text-ink">
          {{ crop.lastUpdated }}
        </dd>
      </div>
    </dl>
  </article>
</template>

<script setup lang="ts">
import type { CropHealthItem } from "~/types";

const props = defineProps<{ crop: CropHealthItem }>();

const statusLabel = computed(() => {
  const map = {
    healthy: "Healthy",
    watch: "Watch",
    at_risk: "At risk",
    critical: "Critical",
  } as const;
  return map[props.crop.status];
});

const statusTone = computed(() => {
  const map = {
    healthy: "success" as const,
    watch: "warning" as const,
    at_risk: "warning" as const,
    critical: "danger" as const,
  };
  return map[props.crop.status];
});

const progressTone = computed(() => {
  if (props.crop.healthScore >= 80) return "success" as const;
  if (props.crop.healthScore >= 65) return "warning" as const;
  return "danger" as const;
});
</script>
