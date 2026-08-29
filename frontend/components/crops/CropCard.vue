<template>
  <article class="surface-card overflow-hidden">
    <div class="relative h-28 sm:h-32">
      <img
        :src="imageSrc"
        :alt="`${crop.name} crop`"
        class="h-full w-full object-cover"
        loading="lazy"
      />
      <div
        class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
      />
      <div class="absolute bottom-3 left-3 right-3">
        <h3 class="text-base font-semibold text-white">{{ crop.name }}</h3>
        <p class="text-xs text-white/85">
          {{ crop.variety || "No variety" }} · {{ crop.fieldName }}
        </p>
      </div>
      <UiStatusBadge
        class="absolute right-3 top-3"
        :tone="healthTone(crop.healthStatus)"
        compact
      >
        {{ healthStatusShortLabel(crop.healthStatus) }}
      </UiStatusBadge>
    </div>

    <div class="p-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-ink-secondary"
        >
          {{ growthStageLabel(crop.growthStage) }}
        </span>
        <span class="text-xs text-ink-muted capitalize">
          {{ crop.season }} {{ crop.year }}
        </span>
      </div>

      <dl class="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3">
        <div>
          <dt class="type-label">Area</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ formatArea(crop.areaHa, landUnit).label }}
          </dd>
        </div>
        <div>
          <dt class="type-label">Health</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ crop.healthScore }}%
          </dd>
        </div>
        <div>
          <dt class="type-label">Expected</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ crop.expectedYield.toLocaleString() }} {{ crop.yieldUnit }}
          </dd>
        </div>
        <div>
          <dt class="type-label">Actual</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            <template v-if="crop.actualYield != null">
              {{ crop.actualYield.toLocaleString() }} {{ crop.yieldUnit }}
            </template>
            <span v-else class="font-medium text-ink-muted">Not recorded</span>
          </dd>
        </div>
      </dl>

      <div
        v-if="achievementPercent != null"
        class="mt-3 border-t border-line pt-3"
      >
        <UiProgressIndicator
          :value="achievementPercent"
          label="Yield achievement"
          :tone="
            achievementPercent >= 95
              ? 'success'
              : achievementPercent >= 80
                ? 'warning'
                : 'danger'
          "
        />
      </div>

      <div class="mt-4 grid grid-cols-2 gap-2">
        <slot name="actions" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { FarmCrop } from "~/types/crop";
import {
  growthStageLabel,
  healthStatusShortLabel,
  healthTone,
} from "~/types/crop";
import { cropImageFor } from "~/utils/cropImages";
import { formatArea } from "~/utils/units";

const props = defineProps<{
  crop: FarmCrop;
  landUnit: "hectares" | "acres";
}>();

const imageSrc = computed(() => cropImageFor(props.crop.name));

const achievementPercent = computed(() => {
  if (props.crop.actualYield == null || props.crop.expectedYield <= 0)
    return null;
  return Math.min(
    100,
    Math.round((props.crop.actualYield / props.crop.expectedYield) * 100),
  );
});
</script>
