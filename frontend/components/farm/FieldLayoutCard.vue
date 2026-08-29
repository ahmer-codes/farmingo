<template>
  <button
    type="button"
    class="group relative flex min-h-[8.5rem] flex-col justify-between rounded-md border p-3 text-left transition hover:border-brand-400 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
    :class="[healthShell, spanClass]"
    @click="$emit('select', field)"
  >
    <div class="flex items-start justify-between gap-2">
      <div>
        <p class="text-sm font-semibold text-ink">{{ field.name }}</p>
        <p class="type-helper mt-0.5">{{ areaLabel }}</p>
      </div>
      <UiStatusBadge
        v-if="field.crop"
        :tone="healthTone(field.crop.healthStatus)"
      >
        {{ healthStatusLabel(field.crop.healthStatus) }}
      </UiStatusBadge>
      <UiStatusBadge v-else tone="info">Fallow</UiStatusBadge>
    </div>

    <div class="mt-3">
      <p class="text-sm font-medium text-ink">
        {{ field.crop?.name || "No active crop" }}
      </p>
      <p v-if="field.crop" class="type-helper mt-1">
        Est. {{ formatYield(field.crop.expectedYield, field.crop.yieldUnit) }}
        <template v-if="field.crop.actualYield != null">
          · Actual
          {{ formatYield(field.crop.actualYield, field.crop.yieldUnit) }}
        </template>
      </p>
    </div>
  </button>
</template>

<script setup lang="ts">
import type { FarmField } from "~/types/crop";
import { healthStatusLabel, healthTone } from "~/types/crop";
import { formatArea } from "~/utils/units";

const props = defineProps<{ field: FarmField }>();
defineEmits<{ select: [field: FarmField] }>();

const { user } = useAuth();
const areaLabel = computed(
  () =>
    formatArea(
      props.field.areaHa,
      user.value?.preferences.landUnit || "hectares",
    ).label,
);

const spanClass = computed(() => {
  if ((props.field.layoutSpan || 1) >= 2) return "sm:col-span-2";
  return "";
});

const healthShell = computed(() => {
  const status = props.field.crop?.healthStatus;
  if (status === "critical") return "border-danger/30 bg-danger-soft/40";
  if (status === "at_risk") return "border-amber-300 bg-amber-50/50";
  if (status === "watch") return "border-amber-200 bg-amber-50/30";
  if (status === "healthy") return "border-brand-200 bg-brand-50/40";
  return "border-line bg-canvas";
});

function formatYield(value: number, unit: string) {
  return `${value.toLocaleString()} ${unit}`;
}
</script>
