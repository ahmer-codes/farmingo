<template>
  <div class="space-y-6">
    <UiPageHeroBanner
      :image-src="farmHeroImage"
      :title="farmName"
      :description="`${locationLabel}, field overview with crop, area, health, and yield context.`"
    >
      <template #actions>
        <UiAppButton
          variant="secondary"
          size="sm"
          class="!border-white/25 !bg-white/10 !text-white hover:!bg-white/15"
          @click="navigateTo('/crops')"
        >
          Manage crops
        </UiAppButton>
      </template>
    </UiPageHeroBanner>

    <div
      v-if="isInitialLoad"
      class="space-y-6"
      aria-busy="true"
      aria-label="Loading farm fields"
    >
      <div class="grid gap-3 sm:grid-cols-3">
        <UiStatCardSkeleton v-for="n in 3" :key="n" />
      </div>
      <section class="surface-card p-5">
        <UiSkeleton height="sm" width="md" />
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <div
            v-for="n in 4"
            :key="n"
            class="rounded-md border border-line p-4"
          >
            <UiSkeleton height="md" width="md" />
            <UiSkeleton class="mt-3" height="lg" width="full" />
          </div>
        </div>
      </section>
    </div>

    <UiErrorState
      v-else-if="fetchError"
      :message="fetchError"
      retry-label="Try again"
      @retry="load"
    />

    <template v-else>
      <div class="relative space-y-6">
        <div
          v-if="refreshing"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
          aria-hidden="true"
        >
          <span
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-secondary shadow-card"
          >
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
            />
            Refreshing…
          </span>
        </div>

        <div :class="{ 'opacity-60': refreshing }" class="space-y-6">
          <div class="grid gap-3 sm:grid-cols-3">
            <FarmStatCard
              label="Total area"
              :value="totalArea.value"
              :unit="totalArea.unit"
              helper="Across registered fields"
            />
            <FarmStatCard
              label="Active fields"
              :value="String(fields.length)"
              :helper="`${plantedCount} planted`"
            />
            <FarmStatCard
              label="Location"
              :value="locationLabel"
              value-size="text"
              helper="Farm profile"
            />
          </div>

          <section class="surface-card p-5">
            <UiSectionHeader
              title="Field layout"
              description="Clean schematic blocks sized by management area. Click a field for details."
            />
            <div v-if="fields.length" class="mt-4 grid gap-3 sm:grid-cols-2">
              <FarmFieldLayoutCard
                v-for="field in fields"
                :key="field.id"
                :field="field"
                @select="selected = $event"
              />
            </div>
            <UiEmptyState
              v-else
              class="mt-4"
              title="No fields yet"
              description="Fields are created during farm setup. Add crops that reference a field, or complete your farm profile."
            />
            <p class="type-helper mt-4">
              Precise geographic boundaries and satellite imagery can be linked
              later via the field geo metadata, this view never invents GPS
              polygons.
            </p>
          </section>
        </div>
      </div>
    </template>

    <FarmFieldDetailDrawer :field="selected" @close="selected = null" />
  </div>
</template>

<script setup lang="ts">
import type { AsyncState } from "~/types";
import type { FarmField } from "~/types/crop";
import { fieldService } from "~/services/crop.service";
import { formatArea } from "~/utils/units";
import { getAuthToken } from "~/services/authToken";
import { farmHeroImage } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Farm" });

const { farm, isReady, user } = useAuth();
const toast = useToast();

const fields = ref<FarmField[]>([]);
const state = ref<AsyncState>("idle");
const fetchError = ref("");
const refreshing = ref(false);
const selected = ref<FarmField | null>(null);

const isInitialLoad = computed(
  () => !isReady.value || (state.value === "loading" && !fields.value.length),
);

const farmName = computed(() => farm.value?.name || "Your farm");
const locationLabel = computed(() => {
  if (!farm.value) return "-";
  return [farm.value.location, farm.value.region].filter(Boolean).join(", ");
});
const landUnit = computed(
  () => user.value?.preferences.landUnit || farm.value?.unit || "hectares",
);
const totalAreaHa = computed(() =>
  Number(fields.value.reduce((sum, f) => sum + f.areaHa, 0).toFixed(2)),
);
const totalArea = computed(() => formatArea(totalAreaHa.value, landUnit.value));
const plantedCount = computed(() => fields.value.filter((f) => f.crop).length);

async function load() {
  const hasFields = fields.value.length > 0;
  if (hasFields) {
    refreshing.value = true;
  } else {
    state.value = "loading";
    fetchError.value = "";
  }
  try {
    const token = await getAuthToken();
    fields.value = await fieldService.list(token);
    state.value = "success";
    fetchError.value = "";
  } catch (err) {
    if (!hasFields) {
      state.value = "error";
      fetchError.value =
        err instanceof Error ? err.message : "Unable to load fields";
    } else {
      toast.error(
        "Couldn't refresh fields. Showing the latest available data.",
        err instanceof Error ? err.message : undefined,
      );
    }
  } finally {
    refreshing.value = false;
  }
}

useAuthReadyLoad(load);
</script>
