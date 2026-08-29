<template>
  <div class="space-y-6">
    <header
      class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5"
    >
      <div>
        <p class="type-label">Assessment history</p>
        <h2 class="type-page-title mt-1">Past crop health assessments</h2>
        <p class="type-body mt-1 max-w-2xl">
          Review previous diagnoses, severity, and recommendations for your farm
          crops.
        </p>
      </div>
      <UiAppButton @click="navigateTo('/disease-detection')"
        >New assessment</UiAppButton
      >
    </header>

    <UiLoadingState v-if="loading" message="Loading assessment history…" />

    <UiErrorState
      v-else-if="error"
      :message="error"
      retry-label="Retry"
      @retry="load"
    />

    <UiEmptyState
      v-else-if="!assessments.length"
      title="No assessments yet"
      description="Run a crop health assessment to see results here."
    >
      <template #action>
        <UiAppButton @click="navigateTo('/disease-detection')"
          >Start assessment</UiAppButton
        >
      </template>
    </UiEmptyState>

    <div v-else class="space-y-2">
      <NuxtLink
        v-for="item in assessments"
        :key="item.id"
        :to="`/disease-detection/history/${item.id}`"
        class="surface-card group block overflow-hidden transition-colors hover:border-brand-200"
      >
        <div class="flex min-h-[6.75rem]">
          <div class="relative w-28 shrink-0 overflow-hidden sm:w-32">
            <img
              :src="diseaseImageFor(item.possibleDisease, item.symptoms)"
              alt=""
              class="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
              loading="lazy"
            />
            <div class="absolute inset-0 bg-brand-900/15" aria-hidden="true" />
          </div>

          <div
            class="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3 p-4"
          >
            <div class="min-w-0">
              <p class="text-sm font-semibold text-ink">
                {{ item.possibleDisease }}
              </p>
              <p class="type-body mt-1">
                {{ item.cropName }}
                <span v-if="item.fieldName"> · {{ item.fieldName }}</span>
              </p>
              <p class="type-helper mt-1">{{ formatDate(item.createdAt) }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-2">
              <UiStatusBadge :tone="severityTone(item.severity)">
                {{ formatSeverity(item.severity) }}
              </UiStatusBadge>
              <span class="text-sm font-semibold tabular-nums text-brand-700">
                {{ item.confidence }}%
              </span>
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { DiseaseAssessmentRecord } from "~/types";
import { diseaseService } from "~/services";
import { getAuthToken } from "~/services/authToken";
import { diseaseImageFor } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Assessment History" });

const loading = ref(true);
const error = ref("");
const assessments = ref<DiseaseAssessmentRecord[]>([]);

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatSeverity(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function severityTone(value: string): "danger" | "warning" | "info" {
  if (value === "critical" || value === "high") return "danger";
  if (value === "moderate") return "warning";
  return "info";
}

async function load() {
  loading.value = true;
  error.value = "";
  try {
    const token = await getAuthToken();
    assessments.value = await diseaseService.listAssessments(token);
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to load assessments";
  } finally {
    loading.value = false;
  }
}

useAuthReadyLoad(load);
</script>
