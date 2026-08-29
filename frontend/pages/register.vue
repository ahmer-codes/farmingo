<template>
  <div>
    <h2 class="type-page-title">Create your farm account</h2>
    <p class="type-body mt-1">
      Set up Farmingo in a few steps. Farm details can be completed later.
    </p>

    <UiAppStepper class="mt-6" :steps="stepLabels" :current="step" />

    <!-- Step 1: Account -->
    <form v-if="step === 1" class="space-y-4" @submit.prevent="goAccountNext">
      <UiAppInput
        v-model="account.fullName"
        label="Full name"
        autocomplete="name"
        placeholder="Your name"
        :error="errors.fullName"
        required
      />
      <UiAppInput
        v-model="account.email"
        label="Email"
        type="email"
        autocomplete="email"
        placeholder="you@farm.example"
        :error="errors.email"
        required
      />
      <UiAppInput
        v-model="account.password"
        label="Password"
        type="password"
        autocomplete="new-password"
        placeholder="At least 8 characters"
        :error="errors.password"
        required
      />
      <UiAppInput
        v-model="account.confirmPassword"
        label="Confirm password"
        type="password"
        autocomplete="new-password"
        placeholder="Re-enter password"
        :error="errors.confirmPassword"
        required
      />

      <UiAppErrorState
        v-if="formError"
        :message="formError"
        title="Check your details"
      />

      <UiAppButton type="submit" class="w-full">Continue</UiAppButton>
    </form>

    <!-- Step 2: Farm -->
    <form v-else-if="step === 2" class="space-y-4" @submit.prevent="goFarmNext">
      <p class="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-800">
        Optional, you can skip and finish farm setup from Profile later.
      </p>
      <UiAppInput
        v-model="farm.name"
        label="Farm name"
        placeholder="Green Valley Fields"
        :error="errors.farmName"
      />
      <UiAppInput
        v-model="farm.location"
        label="Farm location"
        placeholder="Village, district, region"
        :error="errors.farmLocation"
      />
      <div class="grid gap-3 sm:grid-cols-2">
        <UiAppInput
          v-model="farmSizeText"
          label="Farm size"
          type="number"
          placeholder="e.g. 12.5"
          :error="errors.farmSize"
        />
        <UiAppSelect v-model="farm.unit" label="Unit" :options="unitOptions" />
      </div>
      <UiAppSelect
        v-model="farm.farmingType"
        label="Main farming type"
        :options="farmingTypeOptions"
      />

      <UiAppErrorState
        v-if="formError"
        :message="formError"
        title="Farm details"
      />

      <div class="flex flex-col gap-2 sm:flex-row">
        <UiAppButton
          type="button"
          variant="secondary"
          class="sm:flex-1"
          @click="step = 1"
        >
          Back
        </UiAppButton>
        <UiAppButton
          type="button"
          variant="ghost"
          class="sm:flex-1"
          @click="skipFarm"
        >
          Skip for now
        </UiAppButton>
        <UiAppButton type="submit" class="sm:flex-1">Continue</UiAppButton>
      </div>
    </form>

    <!-- Step 3: Crops -->
    <div v-else-if="step === 3" class="space-y-4">
      <p class="type-body">
        Select the crops you commonly grow. You can change this later.
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="crop in cropOptions"
          :key="crop"
          type="button"
          class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
          :class="
            selectedCrops.includes(crop)
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-line bg-white text-ink hover:bg-canvas'
          "
          @click="toggleCrop(crop)"
        >
          {{ crop }}
        </button>
      </div>

      <div class="flex flex-col gap-2 sm:flex-row">
        <UiAppButton
          type="button"
          variant="secondary"
          class="sm:flex-1"
          @click="step = 2"
        >
          Back
        </UiAppButton>
        <UiAppButton type="button" class="sm:flex-1" @click="step = 4"
          >Continue</UiAppButton
        >
      </div>
    </div>

    <!-- Step 4: Preferences -->
    <form v-else class="space-y-5" @submit.prevent="submitRegister">
      <div class="grid gap-3 sm:grid-cols-2">
        <UiAppSelect
          v-model="preferences.temperatureUnit"
          label="Temperature unit"
          :options="tempOptions"
        />
        <UiAppSelect
          v-model="preferences.landUnit"
          label="Preferred land unit"
          :options="unitOptions"
        />
      </div>

      <div class="space-y-3 rounded-md border border-line p-4">
        <p class="type-card-title">Notification preferences</p>
        <UiAppCheckbox
          v-model="preferences.notifications.weatherAlerts"
          label="Weather alerts"
          description="Heat, frost, rain, and field risk warnings"
        />
        <UiAppCheckbox
          v-model="preferences.notifications.diseaseAlerts"
          label="Disease alerts"
          description="Notices from crop health assessments"
        />
        <UiAppCheckbox
          v-model="preferences.notifications.taskReminders"
          label="Task reminders"
          description="Due treatments and field work reminders"
        />
        <UiAppCheckbox
          v-model="preferences.notifications.treatmentReminders"
          label="Treatment reminders"
          description="Follow-ups from disease treatment plans"
        />
        <UiAppCheckbox
          v-model="preferences.notifications.generalNotifications"
          label="General notifications"
          description="Product updates and farm workspace messages"
        />
      </div>

      <UiAppErrorState
        v-if="formError"
        :message="formError"
        title="Registration failed"
      />
      <UiAppSuccessState
        v-if="successMessage"
        title="Welcome to Farmingo"
        :message="successMessage"
      />

      <div class="flex flex-col gap-2 sm:flex-row">
        <UiAppButton
          type="button"
          variant="secondary"
          class="sm:flex-1"
          @click="step = 3"
        >
          Back
        </UiAppButton>
        <UiAppButton type="submit" class="sm:flex-1" :loading="submitting">
          Create account
        </UiAppButton>
      </div>
    </form>

    <p class="mt-5 type-body">
      Already have an account?
      <NuxtLink to="/login" class="font-medium text-brand-700 hover:underline"
        >Sign in</NuxtLink
      >
    </p>
  </div>
</template>

<script setup lang="ts">
import {
  CROP_OPTIONS,
  DEFAULT_PREFERENCES,
  FARMING_TYPE_OPTIONS,
  type FarmingType,
  type LandUnit,
  type TemperatureUnit,
} from "~/types";

definePageMeta({
  layout: "auth",
  middleware: "guest",
});

useHead({ title: "Register" });

const { register } = useAuth();

const step = ref(1);
const stepLabels = ["Account", "Farm", "Crops", "Prefs"];
const submitting = ref(false);
const formError = ref("");
const successMessage = ref("");
const skippedFarm = ref(false);

const account = reactive({
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const farm = reactive({
  name: "",
  location: "",
  unit: "hectares" as LandUnit,
  farmingType: "crop" as FarmingType,
});
const farmSizeText = ref("");

const selectedCrops = ref<string[]>([]);
const cropOptions = [...CROP_OPTIONS];

const preferences = reactive({
  temperatureUnit: DEFAULT_PREFERENCES.temperatureUnit as TemperatureUnit,
  landUnit: DEFAULT_PREFERENCES.landUnit as LandUnit,
  notifications: { ...DEFAULT_PREFERENCES.notifications },
});

const errors = reactive<Record<string, string>>({});

const unitOptions = [
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];
const tempOptions = [
  { value: "celsius", label: "Celsius (°C)" },
  { value: "fahrenheit", label: "Fahrenheit (°F)" },
];
const farmingTypeOptions = FARMING_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

function clearErrors() {
  Object.keys(errors).forEach((k) => delete errors[k]);
  formError.value = "";
}

function goAccountNext() {
  clearErrors();
  if (account.fullName.trim().length < 2)
    errors.fullName = "Enter your full name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim())) {
    errors.email = "Enter a valid email";
  }
  if (account.password.length < 8)
    errors.password = "Use at least 8 characters";
  if (account.password !== account.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (Object.keys(errors).length) return;
  step.value = 2;
}

function farmPartiallyFilled() {
  return Boolean(
    farm.name.trim() || farm.location.trim() || farmSizeText.value.trim(),
  );
}

function goFarmNext() {
  clearErrors();
  if (!farmPartiallyFilled()) {
    formError.value = "Add farm details or choose Skip for now.";
    return;
  }
  if (farm.name.trim().length < 2) errors.farmName = "Enter a farm name";
  if (farm.location.trim().length < 2)
    errors.farmLocation = "Enter farm location";
  const size = Number(farmSizeText.value);
  if (!Number.isFinite(size) || size <= 0)
    errors.farmSize = "Enter a valid farm size";
  if (Object.keys(errors).length) return;
  skippedFarm.value = false;
  preferences.landUnit = farm.unit;
  step.value = 3;
}

function skipFarm() {
  clearErrors();
  skippedFarm.value = true;
  farm.name = "";
  farm.location = "";
  farmSizeText.value = "";
  step.value = 3;
}

function toggleCrop(crop: string) {
  if (selectedCrops.value.includes(crop)) {
    selectedCrops.value = selectedCrops.value.filter((c) => c !== crop);
  } else {
    selectedCrops.value = [...selectedCrops.value, crop];
  }
}

async function submitRegister() {
  clearErrors();
  submitting.value = true;
  successMessage.value = "";
  try {
    const size = Number(farmSizeText.value);
    const includeFarm = !skippedFarm.value && farmPartiallyFilled();

    await register({
      fullName: account.fullName.trim(),
      email: account.email.trim(),
      password: account.password,
      farm: includeFarm
        ? {
            name: farm.name.trim(),
            location: farm.location.trim(),
            size,
            unit: farm.unit,
            farmingType: farm.farmingType,
          }
        : null,
      skipFarmSetup: !includeFarm,
      crops: selectedCrops.value,
      preferences: {
        temperatureUnit: preferences.temperatureUnit,
        landUnit: preferences.landUnit,
        notifications: { ...preferences.notifications },
      },
    });
    successMessage.value = "Your account is ready. Opening your dashboard…";
    await navigateTo("/dashboard");
  } catch (err) {
    formError.value = err instanceof Error ? err.message : "Unable to register";
  } finally {
    submitting.value = false;
  }
}
</script>
