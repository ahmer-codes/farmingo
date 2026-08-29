<template>
  <UiModalScrim @close="$emit('close')">
    <form
      class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md border border-line bg-white p-5 shadow-card"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @submit.prevent="onSubmit"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 :id="titleId" class="text-lg font-semibold text-ink">
            {{ crop ? "Edit crop" : "Add crop" }}
          </h3>
          <p class="type-helper mt-1">
            Record planting, stage, health, and yield targets.
          </p>
        </div>
        <UiAppIconButton
          icon="x"
          aria-label="Close crop form"
          title="Close"
          @click="$emit('close')"
        />
      </div>

      <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <UiAppInput v-model="form.name" label="Crop name" required />
        <UiAppInput v-model="form.variety" label="Variety" />
        <UiAppSelect
          v-model="form.fieldId"
          label="Field"
          :options="fieldOptions"
          required
        />
        <UiAppInput v-model="form.area" label="Area" type="number" />
        <UiAppInput
          v-model="form.plantingDate"
          label="Planting date"
          type="date"
          required
        />
        <UiAppInput
          v-model="form.expectedHarvestDate"
          label="Expected harvest"
          type="date"
          required
        />
        <UiAppSelect
          v-model="form.growthStage"
          label="Growth stage"
          :options="GROWTH_STAGE_OPTIONS"
        />
        <UiAppSelect
          v-model="form.healthStatus"
          label="Health status"
          :options="HEALTH_STATUS_OPTIONS"
        />
        <UiAppInput
          v-model="form.expectedYield"
          label="Expected yield"
          type="number"
        />
        <UiAppInput
          v-model="form.actualYield"
          label="Actual yield"
          type="number"
          hint="Leave blank if not harvested"
        />
        <UiAppSelect
          v-model="form.yieldUnit"
          label="Yield unit"
          :options="YIELD_UNIT_OPTIONS"
        />
        <UiAppInput
          v-model="form.season"
          label="Season"
          placeholder="rabi / kharif"
          required
        />
        <UiAppInput v-model="form.year" label="Year" type="number" required />
        <UiAppInput
          v-model="form.healthScore"
          label="Health score"
          type="number"
        />
      </div>

      <UiErrorState
        v-if="error"
        class="mt-3"
        :message="error"
        title="Could not save"
      />

      <div class="mt-5 flex justify-end gap-2">
        <UiAppButton type="button" variant="secondary" @click="$emit('close')"
          >Cancel</UiAppButton
        >
        <UiAppButton type="submit" :loading="saving">{{
          crop ? "Save changes" : "Add crop"
        }}</UiAppButton>
      </div>
    </form>
  </UiModalScrim>
</template>

<script setup lang="ts">
import type {
  CreateCropPayload,
  FarmCrop,
  FarmField,
  GrowthStage,
  CropHealthStatus,
  YieldUnit,
} from "~/types/crop";
import {
  GROWTH_STAGE_OPTIONS,
  HEALTH_STATUS_OPTIONS,
  YIELD_UNIT_OPTIONS,
} from "~/types/crop";

const props = defineProps<{
  crop?: FarmCrop | null;
  fields: FarmField[];
  saving?: boolean;
  error?: string;
}>();

const emit = defineEmits<{
  close: [];
  save: [payload: CreateCropPayload];
}>();

const titleId = "crop-form-title";

const form = reactive({
  name: "",
  variety: "",
  fieldId: "",
  area: "1",
  plantingDate: "",
  expectedHarvestDate: "",
  growthStage: "vegetative",
  expectedYield: "0",
  actualYield: "",
  yieldUnit: "kg",
  season: "rabi",
  year: String(new Date().getFullYear()),
  healthStatus: "healthy",
  healthScore: "85",
});

const fieldOptions = computed(() =>
  props.fields.map((f) => ({
    value: f.id,
    label: `${f.name} (${f.areaHa} ha)`,
  })),
);

watch(
  () => props.crop,
  (crop) => {
    if (crop) {
      form.name = crop.name;
      form.variety = crop.variety || "";
      form.fieldId = crop.fieldId;
      form.area = String(crop.area);
      form.plantingDate = crop.plantingDate;
      form.expectedHarvestDate = crop.expectedHarvestDate;
      form.growthStage = crop.growthStage;
      form.expectedYield = String(crop.expectedYield);
      form.actualYield =
        crop.actualYield == null ? "" : String(crop.actualYield);
      form.yieldUnit = crop.yieldUnit;
      form.season = crop.season;
      form.year = String(crop.year);
      form.healthStatus = crop.healthStatus;
      form.healthScore = String(crop.healthScore);
    } else if (props.fields[0]) {
      form.fieldId = props.fields[0].id;
      form.area = String(props.fields[0].area);
    }
  },
  { immediate: true },
);

function onSubmit() {
  const actualRaw = form.actualYield.trim();
  emit("save", {
    name: form.name.trim(),
    variety: form.variety.trim() || undefined,
    fieldId: form.fieldId,
    area: Number(form.area) || undefined,
    plantingDate: form.plantingDate,
    expectedHarvestDate: form.expectedHarvestDate,
    growthStage: form.growthStage as GrowthStage,
    expectedYield: Number(form.expectedYield) || 0,
    actualYield: actualRaw === "" ? null : Number(actualRaw),
    yieldUnit: form.yieldUnit as YieldUnit,
    season: form.season.trim(),
    year: Number(form.year),
    healthStatus: form.healthStatus as CropHealthStatus,
    healthScore: Number(form.healthScore) || 0,
  });
}

useOverlayEscape({
  active: true,
  onClose: () => emit("close"),
  blocked: () => props.saving ?? false,
});
</script>
