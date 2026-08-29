<template>
  <div class="space-y-6">
    <header
      class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5"
    >
      <div>
        <UiAppButton
          variant="ghost"
          size="sm"
          @click="navigateTo('/disease-detection/history')"
        >
          ← Back to history
        </UiAppButton>
        <h2 class="type-page-title mt-2">
          {{ assessment?.possibleDisease || "Assessment detail" }}
        </h2>
        <p v-if="assessment" class="type-body mt-1">
          {{ assessment.cropName }}
          <span v-if="assessment.fieldName"> · {{ assessment.fieldName }}</span>
          · {{ formatDate(assessment.createdAt) }}
        </p>
      </div>
      <UiAppButton @click="navigateTo('/disease-detection')"
        >New assessment</UiAppButton
      >
    </header>

    <UiLoadingState v-if="loading" message="Loading assessment…" />

    <UiErrorState
      v-else-if="error"
      :message="error"
      retry-label="Retry"
      @retry="load"
    />

    <template v-else-if="assessment">
      <section class="surface-card p-5">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="type-label">Diagnosis</p>
            <h3 class="type-section mt-1">{{ assessment.possibleDisease }}</h3>
            <p v-if="assessment.summary" class="type-body mt-2 max-w-2xl">
              {{ assessment.summary }}
            </p>
          </div>
          <div class="text-right">
            <p class="type-label">Confidence</p>
            <p class="mt-1 text-3xl font-semibold tabular-nums text-brand-700">
              {{ assessment.confidence }}%
            </p>
            <UiStatusBadge
              class="mt-2"
              :tone="severityTone(assessment.severity)"
            >
              {{ formatSeverity(assessment.severity) }} severity
            </UiStatusBadge>
          </div>
        </div>

        <dl class="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <dt class="type-label">Crop</dt>
            <dd class="mt-1 text-sm font-semibold text-ink">
              {{ assessment.cropName }}
            </dd>
            <p v-if="assessment.variety" class="type-helper">
              {{ assessment.variety }}
            </p>
          </div>
          <div>
            <dt class="type-label">Field</dt>
            <dd class="mt-1 text-sm font-semibold text-ink">
              {{ assessment.fieldName || "-" }}
            </dd>
          </div>
          <div>
            <dt class="type-label">Symptoms recorded</dt>
            <dd class="mt-1 text-sm font-semibold text-ink">
              {{ assessment.symptoms.length }}
            </dd>
          </div>
        </dl>

        <div v-if="assessment.imageUrl" class="mt-4 border-t border-line pt-4">
          <p class="type-label">Uploaded image</p>
          <img
            :src="assessment.imageUrl"
            alt="Assessed crop"
            class="mt-2 max-h-72 rounded-md border border-line object-contain"
          />
        </div>
      </section>

      <section class="grid gap-4 lg:grid-cols-2">
        <article class="surface-card p-5">
          <h3 class="type-section">Recommended actions</h3>
          <ol
            class="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-secondary"
          >
            <li v-for="action in assessment.recommendations" :key="action">
              {{ action }}
            </li>
          </ol>
        </article>
        <article class="surface-card p-5">
          <h3 class="type-section">Symptoms observed</h3>
          <ul class="mt-3 flex flex-wrap gap-2">
            <li
              v-for="symptom in symptomLabels"
              :key="symptom.id"
              class="rounded-md bg-canvas px-2 py-1 text-xs font-medium text-ink-secondary"
            >
              {{ symptom.label }}
            </li>
          </ul>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import type {
  DiseaseAssessmentRecord,
  DiseaseSymptom,
  SymptomCatalog,
} from "~/types";
import { diseaseService } from "~/services";
import { getAuthToken } from "~/services/authToken";

definePageMeta({ middleware: "auth" });

const route = useRoute();

const assessmentId = computed(() => String(route.params.id || ""));

const loading = ref(true);
const error = ref("");
const assessment = ref<DiseaseAssessmentRecord | null>(null);
const symptomCatalog = ref<SymptomCatalog | null>(null);

useHead({
  title: computed(() =>
    assessment.value
      ? `${assessment.value.possibleDisease} · Assessment`
      : "Assessment detail",
  ),
});

const symptomLabels = computed(() => {
  if (!assessment.value) return [] as Array<{ id: string; label: string }>;
  const byId = new Map(
    (symptomCatalog.value?.symptoms || []).map((s: DiseaseSymptom) => [
      s.id,
      s.label,
    ]),
  );
  return assessment.value.symptoms.map((id) => ({
    id,
    label: byId.get(id) || id.replace(/_/g, " "),
  }));
});

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

async function ensureSymptomCatalog() {
  if (symptomCatalog.value) return;
  const token = await getAuthToken();
  symptomCatalog.value = await diseaseService.listSymptoms(token);
}

async function load() {
  loading.value = true;
  error.value = "";
  assessment.value = null;
  try {
    const token = await getAuthToken();
    await ensureSymptomCatalog();
    assessment.value = await diseaseService.getAssessment(
      token,
      assessmentId.value,
    );
  } catch (err) {
    error.value =
      err instanceof Error ? err.message : "Unable to load assessment";
  } finally {
    loading.value = false;
  }
}

watch(assessmentId, () => {
  void load();
});

useAuthReadyLoad(load);
</script>
