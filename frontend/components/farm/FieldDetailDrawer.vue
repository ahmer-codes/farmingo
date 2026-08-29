<template>
  <div
    v-if="field"
    class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
    role="presentation"
    @click.self="$emit('close')"
  >
    <div
      class="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-md border border-line bg-white p-5 shadow-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="field-detail-title"
      tabindex="-1"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="type-label">Field details</p>
          <h3
            id="field-detail-title"
            class="mt-1 text-lg font-semibold text-ink"
          >
            {{ field.name }}
          </h3>
          <p class="type-helper mt-1">
            {{ field.areaHa }} ha · schematic layout (not GPS survey)
          </p>
        </div>
        <UiAppIconButton
          icon="x"
          aria-label="Close"
          title="Close"
          @click="$emit('close')"
        />
      </div>

      <dl class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
        <div>
          <dt class="type-label">Area</dt>
          <dd class="mt-1 text-sm font-semibold tabular-nums text-ink">
            {{ field.area }} {{ field.areaUnit }}
          </dd>
        </div>
        <div>
          <dt class="type-label">Layout slot</dt>
          <dd class="mt-1 text-sm font-semibold text-ink">
            Row {{ field.layoutRow + 1 }} · Col {{ field.layoutCol + 1 }}
          </dd>
        </div>
      </dl>

      <div
        v-if="field.crop"
        class="mt-4 rounded-md border border-line bg-canvas p-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-sm font-semibold text-ink">{{ field.crop.name }}</p>
          <UiStatusBadge :tone="healthTone(field.crop.healthStatus)">
            {{ healthStatusLabel(field.crop.healthStatus) }}
          </UiStatusBadge>
        </div>
        <p v-if="field.crop.variety" class="type-helper mt-1">
          {{ field.crop.variety }}
        </p>
        <p class="type-body mt-2">
          Stage: {{ growthStageLabel(field.crop.growthStage) }} · Score
          {{ field.crop.healthScore }}
        </p>
        <p class="type-body mt-1">
          Expected {{ field.crop.expectedYield.toLocaleString() }}
          {{ field.crop.yieldUnit }}
          <template v-if="field.crop.actualYield != null">
            · Actual {{ field.crop.actualYield.toLocaleString() }}
            {{ field.crop.yieldUnit }}
          </template>
        </p>
        <p class="type-helper mt-2">
          {{ field.crop.season }} {{ field.crop.year }}
        </p>
      </div>
      <UiEmptyState
        v-else
        class="mt-4"
        title="No active crop"
        description="Assign a crop to this field from the Crops page."
      />

      <p class="type-helper mt-4">
        Geographic boundaries are not shown until a real survey or GIS layer is
        linked. Field cards use a clean schematic layout only.
      </p>

      <div class="mt-4 flex flex-wrap gap-2">
        <NuxtLink
          v-if="field.crop"
          :to="`/crops?edit=${field.crop.id}`"
          class="text-sm font-semibold text-brand-700 hover:underline"
        >
          Edit crop
        </NuxtLink>
        <NuxtLink
          to="/crops"
          class="text-sm font-semibold text-brand-700 hover:underline"
        >
          Manage crops
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FarmField } from "~/types/crop";
import { growthStageLabel, healthStatusLabel, healthTone } from "~/types/crop";

const props = defineProps<{ field: FarmField | null }>();
const emit = defineEmits<{ close: [] }>();

useOverlayEscape({
  active: () => Boolean(props.field),
  onClose: () => emit("close"),
});
</script>
