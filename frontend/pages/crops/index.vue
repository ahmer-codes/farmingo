<template>
  <div class="space-y-6">
    <header
      class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5"
    >
      <div>
        <h2 class="type-page-title">Crops</h2>
        <p class="type-body mt-1">
          Add and edit crop records, planting, growth stage, health, and yield.
        </p>
      </div>
      <UiAppButton size="sm" @click="openCreate">
        <UiAppIcon name="plus" size="sm" />
        Add crop
      </UiAppButton>
    </header>

    <div v-if="isInitialLoad" aria-busy="true" aria-label="Loading crops">
      <ul class="space-y-3 md:hidden">
        <li v-for="n in 4" :key="n">
          <UiTableRowSkeleton show-meta />
        </li>
      </ul>
      <div class="hidden space-y-2 md:block">
        <UiTableRowSkeleton v-for="n in 6" :key="n" compact />
      </div>
    </div>

    <UiErrorState
      v-else-if="fetchError"
      :message="fetchError"
      retry-label="Try again"
      @retry="load"
    />

    <template v-else>
      <div class="relative">
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

        <div :class="{ 'opacity-60': refreshing }">
          <template v-if="crops.length">
            <ul class="grid gap-4 sm:grid-cols-2 xl:hidden">
              <li v-for="crop in crops" :key="crop.id">
                <CropsCropCard :crop="crop" :land-unit="landUnit">
                  <template #actions>
                    <UiAppButton
                      type="button"
                      variant="secondary"
                      class="w-full"
                      @click="openEdit(crop)"
                    >
                      <UiAppIcon name="pencil" />
                      Edit
                    </UiAppButton>
                    <UiAppButton
                      type="button"
                      variant="destructive"
                      class="w-full"
                      :loading="deletingId === crop.id"
                      :disabled="Boolean(deletingId)"
                      @click="onDelete(crop)"
                    >
                      <UiAppIcon v-if="deletingId !== crop.id" name="trash-2" />
                      Delete
                    </UiAppButton>
                  </template>
                </CropsCropCard>
              </li>
            </ul>

            <ul class="hidden gap-4 xl:grid xl:grid-cols-2">
              <li v-for="crop in crops" :key="`grid-${crop.id}`">
                <CropsCropCard :crop="crop" :land-unit="landUnit">
                  <template #actions>
                    <UiAppButton
                      type="button"
                      variant="secondary"
                      class="w-full"
                      @click="openEdit(crop)"
                    >
                      Edit
                    </UiAppButton>
                    <UiAppButton
                      type="button"
                      variant="destructive"
                      class="w-full"
                      :loading="deletingId === crop.id"
                      @click="onDelete(crop)"
                    >
                      Delete
                    </UiAppButton>
                  </template>
                </CropsCropCard>
              </li>
            </ul>

            <div
              class="hidden overflow-x-auto rounded-md border border-line bg-white md:block xl:hidden"
            >
              <table class="min-w-full text-left text-sm">
                <thead class="border-b border-line bg-canvas type-label">
                  <tr>
                    <th class="px-3 py-2.5 font-semibold">Crop</th>
                    <th class="px-3 py-2.5 font-semibold">Field</th>
                    <th class="px-3 py-2.5 font-semibold">Area</th>
                    <th class="px-3 py-2.5 font-semibold">Stage</th>
                    <th class="px-3 py-2.5 font-semibold">Health</th>
                    <th class="px-3 py-2.5 font-semibold">Expected</th>
                    <th class="px-3 py-2.5 font-semibold">Actual</th>
                    <th class="px-3 py-2.5 font-semibold">Season</th>
                    <th class="px-3 py-2.5 font-semibold">
                      <span class="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-line">
                  <tr
                    v-for="crop in crops"
                    :key="crop.id"
                    class="hover:bg-canvas/60"
                  >
                    <td class="px-3 py-3">
                      <p class="font-semibold text-ink">{{ crop.name }}</p>
                      <p class="type-helper">{{ crop.variety || "-" }}</p>
                    </td>
                    <td class="px-3 py-3 text-ink-secondary">
                      {{ crop.fieldName }}
                    </td>
                    <td class="px-3 py-3 tabular-nums">
                      {{ formatArea(crop.areaHa, landUnit).label }}
                    </td>
                    <td class="px-3 py-3">
                      {{ growthStageLabel(crop.growthStage) }}
                    </td>
                    <td class="px-3 py-3">
                      <UiStatusBadge
                        :tone="healthTone(crop.healthStatus)"
                        compact
                      >
                        {{ healthStatusShortLabel(crop.healthStatus) }}
                      </UiStatusBadge>
                    </td>
                    <td class="px-3 py-3 tabular-nums">
                      {{ crop.expectedYield.toLocaleString() }}
                      {{ crop.yieldUnit }}
                    </td>
                    <td class="px-3 py-3 tabular-nums">
                      <template v-if="crop.actualYield != null">
                        {{ crop.actualYield.toLocaleString() }}
                        {{ crop.yieldUnit }}
                      </template>
                      <span v-else class="text-ink-muted">, </span>
                    </td>
                    <td class="px-3 py-3 capitalize">
                      {{ crop.season }} {{ crop.year }}
                    </td>
                    <td class="px-3 py-3 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-1">
                        <UiAppIconButton
                          icon="pencil"
                          aria-label="Edit crop"
                          title="Edit crop"
                          size="md"
                          @click="openEdit(crop)"
                        />
                        <UiAppIconButton
                          icon="trash-2"
                          aria-label="Delete crop"
                          title="Delete crop"
                          variant="destructive"
                          size="md"
                          :loading="deletingId === crop.id"
                          :disabled="Boolean(deletingId)"
                          @click="onDelete(crop)"
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>

          <UiEmptyState
            v-else
            title="No crops registered yet"
            description="Your farm doesn't have any crops yet. Add your first crop with field, planting dates, and yield targets."
            :image-src="emptyCropImage"
          >
            <template #action>
              <UiAppButton @click="openCreate">
                <UiAppIcon name="plus" />
                Add crop
              </UiAppButton>
            </template>
          </UiEmptyState>
        </div>
      </div>
    </template>

    <CropsCropFormModal
      v-if="showForm"
      :crop="editing"
      :fields="fields"
      :saving="saving"
      :error="formError"
      @close="closeForm"
      @save="onSave"
    />
  </div>
</template>

<script setup lang="ts">
import type { AsyncState } from "~/types";
import type { CreateCropPayload, FarmCrop, FarmField } from "~/types/crop";
import {
  growthStageLabel,
  healthStatusLabel,
  healthStatusShortLabel,
  healthTone,
} from "~/types/crop";
import { cropService, fieldService } from "~/services/crop.service";
import { formatArea } from "~/utils/units";
import { getAuthToken } from "~/services/authToken";
import { emptyCropImage } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Crops" });

const route = useRoute();
const { isReady, user } = useAuth();
const toast = useToast();
const { confirm } = useConfirm();

const crops = ref<FarmCrop[]>([]);
const fields = ref<FarmField[]>([]);
const state = ref<AsyncState>("idle");
const fetchError = ref("");
const refreshing = ref(false);
const showForm = ref(false);
const editing = ref<FarmCrop | null>(null);
const saving = ref(false);
const formError = ref("");
const deletingId = ref<string | null>(null);

const isInitialLoad = computed(
  () => !isReady.value || (state.value === "loading" && !crops.value.length),
);
const landUnit = computed(() => user.value?.preferences.landUnit || "hectares");

async function load() {
  const hasCrops = crops.value.length > 0;
  if (hasCrops) {
    refreshing.value = true;
  } else {
    state.value = "loading";
    fetchError.value = "";
  }
  try {
    const token = await getAuthToken();
    const [cropRows, fieldRows] = await Promise.all([
      cropService.list(token),
      fieldService.list(token),
    ]);
    crops.value = cropRows;
    fields.value = fieldRows;
    state.value = "success";
    fetchError.value = "";

    const editId = typeof route.query.edit === "string" ? route.query.edit : "";
    if (editId) {
      const match = cropRows.find((c) => c.id === editId);
      if (match) openEdit(match);
    }
  } catch (err) {
    if (!hasCrops) {
      state.value = "error";
      fetchError.value =
        err instanceof Error ? err.message : "Unable to load crops";
    } else {
      toast.error(
        "Could not refresh crops",
        err instanceof Error ? err.message : "Try again",
      );
    }
  } finally {
    refreshing.value = false;
  }
}

function openCreate() {
  editing.value = null;
  formError.value = "";
  showForm.value = true;
}

function openEdit(crop: FarmCrop) {
  editing.value = crop;
  formError.value = "";
  showForm.value = true;
}

function closeForm() {
  showForm.value = false;
  editing.value = null;
  formError.value = "";
}

async function onSave(payload: CreateCropPayload) {
  saving.value = true;
  formError.value = "";
  try {
    const token = await getAuthToken();
    if (editing.value) {
      await cropService.update(token, editing.value.id, payload);
      toast.success("Crop updated", `${payload.name} was saved.`);
    } else {
      await cropService.create(token, payload);
      toast.success("Crop added", `${payload.name} is now on your farm.`);
    }
    closeForm();
    await load();
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Unable to save crop";
  } finally {
    saving.value = false;
  }
}

async function onDelete(crop: FarmCrop) {
  if (deletingId.value) return;
  const ok = await confirm({
    title: `Delete ${crop.name}?`,
    message: `This removes the crop record from ${crop.fieldName}. Yield history linked to other seasons is kept.`,
    confirmLabel: "Delete crop",
    destructive: true,
  });
  if (!ok) return;
  deletingId.value = crop.id;
  try {
    const token = await getAuthToken();
    await cropService.remove(token, crop.id);
    toast.success("Crop deleted", `${crop.name} was removed.`);
    await load();
  } catch (err) {
    toast.error(
      "Could not delete crop",
      err instanceof Error ? err.message : "Try again",
    );
  } finally {
    deletingId.value = null;
  }
}

useAuthReadyLoad(load);
</script>
