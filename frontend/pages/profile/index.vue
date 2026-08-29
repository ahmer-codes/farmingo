<template>
  <div class="space-y-6">
    <header class="border-b border-line pb-5">
      <h2 class="type-page-title">Profile</h2>
      <p class="type-body mt-1">
        Manage your personal details, farm setup, and crops grown.
      </p>
    </header>

    <UiLoadingState v-if="!user" message="Loading profile…" />

    <template v-else>
      <UiErrorState
        v-if="formError"
        :message="formError"
        title="Could not save"
      />

      <!-- Personal -->
      <section class="surface-card p-5">
        <UiSectionHeader
          title="Personal information"
          description="How you appear across Farmingo."
        />
        <div class="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div class="flex flex-col items-center gap-2">
            <img
              :src="avatarPreview"
              :alt="`${form.fullName || 'Farmer'} profile photo`"
              class="h-20 w-20 rounded-full object-cover ring-1 ring-line"
            />
            <label
              class="cursor-pointer text-xs font-semibold text-brand-600 hover:text-brand-700"
              :class="{
                'pointer-events-none opacity-60': image.uploading.value,
              }"
            >
              {{ image.uploading.value ? "Uploading…" : "Change photo" }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                class="hidden"
                :disabled="image.uploading.value"
                @change="onAvatarChange"
              />
            </label>
            <button
              v-if="image.file.value && !image.uploading.value"
              type="button"
              class="text-xs text-ink-muted hover:text-ink"
              @click="clearPendingAvatar"
            >
              Remove selection
            </button>
            <div v-if="image.uploading.value" class="w-24">
              <div class="h-1.5 overflow-hidden rounded-full bg-canvas">
                <div
                  class="h-full bg-brand-600 transition-all"
                  :style="{ width: `${image.progress.value}%` }"
                />
              </div>
              <p class="mt-1 text-center text-[10px] text-ink-muted">
                {{ image.progress.value }}%
              </p>
            </div>
            <p
              v-if="image.error.value"
              class="max-w-[10rem] text-center text-[11px] text-red-600"
            >
              {{ image.error.value }}
            </p>
          </div>
          <div class="grid flex-1 gap-3 sm:grid-cols-2">
            <UiAppInput v-model="form.fullName" label="Full name" required />
            <UiAppInput
              v-model="form.email"
              label="Email"
              type="email"
              disabled
              hint="Email cannot be changed here"
            />
            <UiAppInput
              v-model="form.phone"
              label="Phone"
              type="tel"
              placeholder="+92 …"
              class="sm:col-span-2"
            />
          </div>
        </div>
      </section>

      <!-- Farm -->
      <section class="surface-card p-5">
        <UiSectionHeader
          title="Farm information"
          :description="
            farm?.onboardingComplete
              ? 'Your registered farm details.'
              : 'Complete farm setup to unlock better recommendations.'
          "
        />
        <div
          v-if="!farm?.onboardingComplete"
          class="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800"
        >
          Farm onboarding is incomplete. Fill in name, location, and size below.
        </div>
        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <UiAppInput v-model="form.farmName" label="Farm name" />
          <UiAppInput v-model="form.farmLocation" label="Farm location" />
          <UiAppInput v-model="form.farmSize" label="Farm size" type="number" />
          <UiAppSelect
            v-model="form.farmUnit"
            label="Unit"
            :options="unitOptions"
          />
          <UiAppSelect
            v-model="form.farmingType"
            label="Farming type"
            class="sm:col-span-2"
            :options="farmingTypeOptions"
          />
        </div>
      </section>

      <!-- Crops -->
      <section class="surface-card p-5">
        <UiSectionHeader
          title="Crops grown"
          description="Crops you commonly cultivate on this farm."
        />
        <div class="mt-4 flex flex-wrap gap-2">
          <button
            v-for="crop in cropOptions"
            :key="crop"
            type="button"
            class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors"
            :class="
              form.crops.includes(crop)
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-line bg-white text-ink hover:bg-canvas'
            "
            :aria-pressed="form.crops.includes(crop)"
            @click="toggleCrop(crop)"
          >
            {{ crop }}
          </button>
        </div>
        <p v-if="!form.crops.length" class="type-helper mt-3">
          No crops selected yet.
        </p>
        <p class="type-helper mt-3">
          Field-level crop records live on
          <NuxtLink
            to="/crops"
            class="font-semibold text-brand-700 hover:underline"
            >Crops</NuxtLink
          >. Alert preferences are in
          <NuxtLink
            to="/settings"
            class="font-semibold text-brand-700 hover:underline"
            >Settings</NuxtLink
          >.
        </p>
      </section>

      <div class="flex justify-end">
        <UiAppButton :loading="saving" @click="saveProfile"
          >Save changes</UiAppButton
        >
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import farmerPfp from "~/assets/farmer-pfp.jpeg";
import {
  CROP_OPTIONS,
  FARMING_TYPE_OPTIONS,
  type FarmingType,
  type LandUnit,
} from "~/types";

definePageMeta({ middleware: "auth" });
useHead({ title: "Profile" });

const { user, farm, updateProfile, uploadProfileImage, fetchMe } = useAuth();
const toast = useToast();
const image = useImageUpload();

const saving = ref(false);
const formError = ref("");

const form = reactive({
  fullName: "",
  email: "",
  phone: "",
  farmName: "",
  farmLocation: "",
  farmSize: "",
  farmUnit: "hectares" as LandUnit,
  farmingType: "crop" as FarmingType,
  crops: [] as string[],
});

const cropOptions = [...CROP_OPTIONS];
const unitOptions = [
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];
const farmingTypeOptions = FARMING_TYPE_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
}));

const avatarPreview = computed(
  () => image.previewUrl.value || user.value?.avatarUrl || farmerPfp,
);

function hydrateForm() {
  if (!user.value) return;
  form.fullName = user.value.fullName;
  form.email = user.value.email;
  form.phone = user.value.phone || "";
  form.farmUnit = farm.value?.unit || user.value.preferences.landUnit;
  form.farmName = farm.value?.name || "";
  form.farmLocation = farm.value?.location || "";
  form.farmSize = farm.value?.size ? String(farm.value.size) : "";
  form.farmingType = farm.value?.farmingType || "crop";
  form.crops = [...(farm.value?.primaryCrops || [])];
}

watch([user, farm], hydrateForm, { immediate: true });

onMounted(async () => {
  if (!user.value) {
    try {
      await fetchMe();
    } catch {
      /* middleware handles redirect */
    }
  }
});

function toggleCrop(crop: string) {
  if (form.crops.includes(crop)) {
    form.crops = form.crops.filter((c) => c !== crop);
  } else {
    form.crops = [...form.crops, crop];
  }
}

function onAvatarChange(event: Event) {
  formError.value = "";
  image.onInputChange(event);
  if (image.error.value) {
    formError.value = image.error.value;
  }
}

function clearPendingAvatar() {
  image.clear();
}

async function saveProfile() {
  formError.value = "";
  if (form.fullName.trim().length < 2) {
    formError.value = "Full name is required.";
    return;
  }
  saving.value = true;
  try {
    if (image.file.value) {
      image.beginUpload();
      try {
        await uploadProfileImage(image.file.value, (percent) =>
          image.setProgress(percent),
        );
        image.finishUpload(true);
        image.clear();
        toast.success("Photo updated", "Your profile image was uploaded.");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to upload profile image";
        image.finishUpload(false, message);
        formError.value = message;
        throw err;
      }
    }

    await updateProfile({
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      farm: {
        name: form.farmName.trim(),
        location: form.farmLocation.trim(),
        size: Number(form.farmSize) || 0,
        unit: form.farmUnit,
        farmingType: form.farmingType,
      },
      crops: form.crops,
      preferences: {
        landUnit: form.farmUnit,
      },
    });
    toast.success("Profile saved", "Your farm details were updated.");
    hydrateForm();
  } catch (err) {
    if (!formError.value) {
      formError.value =
        err instanceof Error ? err.message : "Unable to save profile";
    }
  } finally {
    saving.value = false;
  }
}
</script>
