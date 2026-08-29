<template>
  <div class="space-y-6">
    <UiPageHeroBanner
      :image-src="diseaseSectionImages.hero"
      eyebrow="Crop health assessment"
      title="Disease detection"
      description="Upload crop images, select symptoms, and get rule-based recommendations linked to your field and crop records."
    >
      <template #actions>
        <UiAppButton
          variant="secondary"
          class="!border-white/25 !bg-white/10 !text-white hover:!bg-white/15"
          @click="navigateTo('/disease-detection/history')"
        >
          View history
        </UiAppButton>
      </template>
    </UiPageHeroBanner>

    <UiAppStepper :steps="stepLabels" :current="uiStep" />

    <UiLoadingState
      v-if="bootstrapping"
      message="Loading your crops and symptoms…"
    />

    <UiErrorState
      v-else-if="bootError"
      :message="bootError"
      retry-label="Retry"
      @retry="bootstrap"
    />

    <template v-else>
      <!-- Step 1: Crop -->
      <DiseaseSectionShell
        v-if="step === 1"
        :image-src="diseaseSectionImages.cropStep"
        inner-class="space-y-4 p-5"
      >
        <UiSectionHeader
          title="Select your crop"
          description="Choose one of your farm crops to assess. Disease rules are matched from the crop name."
        />

        <UiEmptyState
          v-if="!userCrops.length"
          title="No crops on your farm"
          description="Add a crop to a field before running a health assessment."
          :image-src="emptyCropImage"
        >
          <template #action>
            <UiAppButton @click="navigateTo('/crops')"
              >Manage crops</UiAppButton
            >
          </template>
        </UiEmptyState>

        <template v-else>
          <DiseaseFarmCropSearchSelect
            v-model="cropRecordId"
            :options="userCrops"
            label="Your crop"
            :error="errors.crop"
          />
          <p v-if="selectedCrop" class="type-helper">
            Field: {{ selectedCrop.fieldName }}
            <span v-if="selectedCrop.variety">
              · Variety: {{ selectedCrop.variety }}</span
            >
          </p>
        </template>

        <div class="flex justify-end">
          <UiAppButton :disabled="!cropRecordId" @click="goToImage"
            >Continue</UiAppButton
          >
        </div>
      </DiseaseSectionShell>

      <!-- Step 2: Image -->
      <DiseaseSectionShell
        v-else-if="step === 2"
        :image-src="diseaseSectionImages.imageStep"
        inner-class="space-y-4 p-5"
      >
        <UiSectionHeader
          title="Crop image"
          description="Optional but recommended. Upload, drop, or capture a clear photo of the affected plant part."
        />
        <DiseaseImageUploadField
          v-model="imageMeta"
          v-model:preview-url="previewUrl"
          @file-selected="onFileSelected"
        />
        <p v-if="uploadError" class="text-xs text-danger">{{ uploadError }}</p>
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <UiAppButton variant="secondary" @click="step = 1">Back</UiAppButton>
          <div class="flex gap-2">
            <UiAppButton variant="ghost" @click="skipImage"
              >Skip image</UiAppButton
            >
            <UiAppButton @click="goToSymptoms">Continue</UiAppButton>
          </div>
        </div>
      </DiseaseSectionShell>

      <!-- Step 3: Symptoms -->
      <DiseaseSectionShell
        v-else-if="step === 3"
        :image-src="diseaseSectionImages.symptomsStep"
        inner-class="space-y-4 p-5"
      >
        <UiSectionHeader
          title="Select symptoms"
          description="Search and choose all symptoms you are observing in the field."
        />
        <DiseaseSymptomMultiSelect
          v-if="catalog"
          v-model="symptomIds"
          :catalog="catalog"
          label="Observed symptoms"
          :error="errors.symptoms"
        />
        <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <UiAppButton variant="secondary" @click="step = 2">Back</UiAppButton>
          <UiAppButton
            :disabled="!symptomIds.length"
            :loading="analyzing"
            @click="runAnalysis"
          >
            Run assessment
          </UiAppButton>
        </div>
        <UiErrorState
          v-if="analyzeError"
          :message="analyzeError"
          title="Assessment failed"
        />
      </DiseaseSectionShell>

      <!-- Step 4: Analyzing -->
      <DiseaseAnalysisProgress
        v-else-if="step === 4"
        :uploading="uploadingImage"
      />

      <!-- Result -->
      <DiseaseResultPanel
        v-else-if="step === 5 && result"
        :result="result"
        :preview-url="previewUrl"
        :creating-plan="creatingPlan"
        :plan-message="planMessage"
        :plan-error="planError"
        @restart="resetFlow"
        @create-plan="createPlan"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import type { DiseaseAnalysisResult, ImageMeta, SymptomCatalog } from "~/types";
import type { FarmCrop } from "~/types/crop";
import { cropService, diseaseService, uploadService } from "~/services";
import { getAuthToken } from "~/services/authToken";
import { diseaseSectionImages, emptyCropImage } from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Crop Health Assessment" });

const toast = useToast();

const step = ref(1);
const stepLabels = ["Crop", "Image", "Symptoms", "Result"];
const uiStep = computed(() => (step.value === 4 ? 4 : Math.min(step.value, 4)));

const bootstrapping = ref(true);
const bootError = ref("");
const userCrops = ref<FarmCrop[]>([]);
const catalog = ref<SymptomCatalog | null>(null);

const cropRecordId = ref("");
const imageMeta = ref<ImageMeta | null>(null);
const selectedFile = ref<File | null>(null);
const previewUrl = ref<string | null>(null);
const symptomIds = ref<string[]>([]);

const analyzing = ref(false);
const uploadingImage = ref(false);
const uploadError = ref("");
const analyzeError = ref("");
const result = ref<DiseaseAnalysisResult | null>(null);

const creatingPlan = ref(false);
const planMessage = ref("");
const planError = ref("");

const errors = reactive<{ crop?: string; symptoms?: string }>({});

const selectedCrop = computed(() =>
  userCrops.value.find((c) => c.id === cropRecordId.value),
);

async function bootstrap() {
  bootstrapping.value = true;
  bootError.value = "";
  try {
    const token = await getAuthToken();
    const [crops, symptomCatalog] = await Promise.all([
      cropService.list(token),
      diseaseService.listSymptoms(token),
    ]);
    userCrops.value = crops;
    catalog.value = symptomCatalog;
  } catch (err) {
    bootError.value =
      err instanceof Error ? err.message : "Unable to load assessment data";
  } finally {
    bootstrapping.value = false;
  }
}

function onFileSelected(file: File | null) {
  selectedFile.value = file;
  uploadError.value = "";
}

function goToImage() {
  errors.crop = undefined;
  if (!cropRecordId.value) {
    errors.crop = "Select one of your crops to continue.";
    return;
  }
  step.value = 2;
}

function skipImage() {
  imageMeta.value = null;
  previewUrl.value = null;
  selectedFile.value = null;
  uploadError.value = "";
  step.value = 3;
}

function goToSymptoms() {
  step.value = 3;
}

async function runAnalysis() {
  errors.symptoms = undefined;
  analyzeError.value = "";
  uploadError.value = "";
  planMessage.value = "";

  if (!cropRecordId.value) {
    step.value = 1;
    errors.crop = "Select a crop before analysis.";
    return;
  }
  if (!symptomIds.value.length) {
    errors.symptoms = "Select at least one symptom.";
    return;
  }

  let token: string;
  try {
    token = await getAuthToken();
  } catch {
    analyzeError.value = "Please sign in again";
    return;
  }

  analyzing.value = true;
  step.value = 4;

  let imageUrl: string | undefined;
  let imagePublicId: string | undefined;

  try {
    if (selectedFile.value) {
      uploadingImage.value = true;
      try {
        const uploaded = await uploadService.uploadDiseaseImage(
          selectedFile.value,
        );
        imageUrl = uploaded.imageUrl;
        imagePublicId = uploaded.publicId;
      } catch (err) {
        uploadError.value =
          err instanceof Error ? err.message : "Image upload failed";
        analyzeError.value = uploadError.value;
        step.value = 3;
        return;
      } finally {
        uploadingImage.value = false;
      }
    }

    const data = await diseaseService.analyze(token, {
      cropRecordId: cropRecordId.value,
      symptomIds: symptomIds.value,
      image: imageMeta.value,
      imageUrl,
      imagePublicId,
    });
    result.value = data;
    step.value = 5;
  } catch (err) {
    analyzeError.value = err instanceof Error ? err.message : "Analysis failed";
    step.value = 3;
  } finally {
    analyzing.value = false;
    uploadingImage.value = false;
  }
}

async function createPlan() {
  if (!result.value?.assessmentId) return;
  creatingPlan.value = true;
  planMessage.value = "";
  planError.value = "";
  try {
    const token = await getAuthToken();
    const plan = await diseaseService.createTreatmentPlan(
      token,
      result.value.assessmentId,
    );
    planMessage.value = plan.message;
    toast.success("Treatment plan created", plan.message);
    await navigateTo({ path: "/tasks", query: { plan: plan.planId } });
  } catch (err) {
    planError.value =
      err instanceof Error ? err.message : "Could not create treatment plan";
    toast.error("Could not create plan", planError.value);
  } finally {
    creatingPlan.value = false;
  }
}

function resetFlow() {
  step.value = 1;
  cropRecordId.value = "";
  imageMeta.value = null;
  selectedFile.value = null;
  previewUrl.value = null;
  symptomIds.value = [];
  result.value = null;
  planMessage.value = "";
  planError.value = "";
  analyzeError.value = "";
  uploadError.value = "";
  errors.crop = undefined;
  errors.symptoms = undefined;
}

useAuthReadyLoad(bootstrap);
</script>
