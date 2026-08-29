<template>
  <div class="space-y-5">
    <div
      class="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p class="font-semibold">AI-assisted assessment</p>
      <p class="mt-1 leading-relaxed">{{ result.disclaimer }}</p>
    </div>

    <DiseaseSectionShell :image-src="diseaseSectionImages.resultPrimary">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="type-label">{{ framingLabel }}</p>
          <h2 class="type-page-title mt-1">
            {{ result.possibleProblem.name }}
          </h2>
          <p class="type-body mt-2 max-w-2xl">{{ result.summary }}</p>
        </div>
        <div class="text-right">
          <p class="type-label">Assessment confidence</p>
          <p class="mt-1 text-3xl font-semibold tabular-nums text-brand-700">
            {{ result.confidencePercent }}%
          </p>
          <UiStatusBadge class="mt-2" :tone="severityTone"
            >{{ result.severityLabel }} severity</UiStatusBadge
          >
        </div>
      </div>

      <dl
        class="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <dt class="type-label">Crop</dt>
          <dd class="mt-1 text-sm font-semibold text-ink">
            {{ result.cropContext?.cropName || result.crop.name }}
          </dd>
          <p v-if="result.cropContext?.variety" class="type-helper">
            {{ result.cropContext.variety }}
          </p>
        </div>
        <div>
          <dt class="type-label">Field</dt>
          <dd class="mt-1 text-sm font-semibold text-ink">
            {{ result.cropContext?.fieldName || "-" }}
          </dd>
        </div>
        <div>
          <dt class="type-label">Method</dt>
          <dd class="mt-1 text-sm font-semibold text-ink">
            AI-assisted assessment
          </dd>
        </div>
        <div>
          <dt class="type-label">Image</dt>
          <dd class="mt-1 text-sm font-semibold text-ink">
            {{ imageLabel }}
          </dd>
        </div>
      </dl>

      <div v-if="displayImageUrl" class="mt-4 border-t border-line pt-4">
        <p class="type-label">Uploaded image</p>
        <img
          :src="displayImageUrl"
          alt="Assessed crop"
          class="mt-2 max-h-64 rounded-md border border-line object-contain"
        />
      </div>
    </DiseaseSectionShell>

    <section class="grid gap-4 lg:grid-cols-2">
      <DiseaseSectionShell
        as="article"
        :image-src="diseaseSectionImages.resultSymptoms"
      >
        <h3 class="type-section">Observed symptoms</h3>
        <ul class="mt-3 space-y-2">
          <li
            v-for="symptom in result.observedSymptoms"
            :key="symptom.id"
            class="flex items-center justify-between gap-2 text-sm"
          >
            <span class="font-medium text-ink">{{ symptom.label }}</span>
            <span class="type-helper">{{ symptom.category }}</span>
          </li>
        </ul>
      </DiseaseSectionShell>

      <DiseaseSectionShell
        as="article"
        :image-src="diseaseSectionImages.resultRisk"
      >
        <h3 class="type-section">Expected risk</h3>
        <p class="type-body mt-3">{{ result.expectedRisk }}</p>
        <h4 class="type-card-title mt-4">When to reassess</h4>
        <p class="type-body mt-1">{{ result.reassessmentGuidance }}</p>
      </DiseaseSectionShell>
    </section>

    <section class="grid gap-4 lg:grid-cols-2">
      <DiseaseSectionShell
        as="article"
        :image-src="diseaseSectionImages.resultActions"
      >
        <h3 class="type-section">Recommended actions</h3>
        <ol class="mt-3 list-decimal space-y-2 pl-5 text-sm text-ink-secondary">
          <li v-for="action in result.recommendedActions" :key="action">
            {{ action }}
          </li>
        </ol>
      </DiseaseSectionShell>
      <DiseaseSectionShell
        as="article"
        :image-src="diseaseSectionImages.cropStep"
      >
        <h3 class="type-section">Prevention</h3>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-sm text-ink-secondary">
          <li v-for="item in result.prevention" :key="item">{{ item }}</li>
        </ul>
      </DiseaseSectionShell>
    </section>

    <DiseaseSectionShell
      v-if="result.alternatives.length"
      :image-src="diseaseSectionImages.resultAlternatives"
    >
      <h3 class="type-section">Other possible conditions</h3>
      <ul class="mt-3 space-y-2">
        <li
          v-for="alt in result.alternatives"
          :key="alt.id"
          class="flex items-center justify-between gap-3 text-sm"
        >
          <span class="font-medium text-ink">{{ alt.name }}</span>
          <span class="tabular-nums text-ink-muted"
            >{{ alt.confidencePercent }}% confidence</span
          >
        </li>
      </ul>
    </DiseaseSectionShell>

    <div class="flex flex-col gap-2 sm:flex-row sm:justify-end">
      <UiAppButton variant="secondary" @click="$emit('restart')"
        >New assessment</UiAppButton
      >
      <UiAppButton :loading="creatingPlan" @click="$emit('create-plan')">
        Create Treatment Plan
      </UiAppButton>
    </div>

    <UiErrorState
      v-if="planError"
      :message="planError"
      title="Could not create treatment plan"
    />

    <UiAppSuccessState
      v-if="planMessage"
      title="Treatment plan created"
      :message="planMessage"
    />
  </div>
</template>

<script setup lang="ts">
import type { DiseaseAnalysisResult } from "~/types";
import { diseaseSectionImages } from "~/utils/cropImages";

const props = defineProps<{
  result: DiseaseAnalysisResult;
  previewUrl?: string | null;
  creatingPlan?: boolean;
  planMessage?: string;
  planError?: string;
}>();

defineEmits<{ restart: []; "create-plan": [] }>();

const displayImageUrl = computed(
  () => props.result.imageUrl || props.previewUrl || null,
);

const imageLabel = computed(() => {
  if (props.result.imageUrl) return "Uploaded to Cloudinary";
  if (props.result.imageConsidered) return "Metadata included";
  return "Not provided";
});

const framingLabel = computed(() =>
  props.result.possibleProblem.framing === "likely_condition"
    ? "Likely condition"
    : "Possible issue",
);

const severityTone = computed(() => {
  if (props.result.severity === "critical" || props.result.severity === "high")
    return "danger" as const;
  if (props.result.severity === "moderate") return "warning" as const;
  return "info" as const;
});
</script>
