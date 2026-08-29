<template>
  <div class="space-y-6">
    <header class="border-b border-line pb-5">
      <h2 class="type-page-title">Settings</h2>
      <p class="type-body mt-1">
        Units and notification defaults for your farm workspace.
      </p>
    </header>

    <UiLoadingState v-if="!user" message="Loading settings…" />

    <template v-else>
      <UiErrorState
        v-if="formError"
        :message="formError"
        title="Could not save"
      />

      <section class="surface-card p-5">
        <UiSectionHeader
          title="Measurement units"
          description="Used across weather and yield views."
        />
        <div class="mt-4 grid gap-3 sm:grid-cols-2">
          <UiAppSelect
            v-model="temperatureUnit"
            label="Temperature"
            :options="tempOptions"
          />
          <UiAppSelect
            v-model="landUnit"
            label="Land area"
            :options="unitOptions"
          />
        </div>
      </section>

      <section class="surface-card p-5">
        <UiSectionHeader
          title="Notifications"
          description="Control which alerts reach you."
        />
        <div class="mt-4 space-y-3">
          <UiAppCheckbox
            v-model="notifications.weatherAlerts"
            label="Weather alerts"
            description="Notify when heat, frost, or heavy rain may affect crops"
          />
          <UiAppCheckbox
            v-model="notifications.diseaseAlerts"
            label="Disease alerts"
            description="Notices from crop health assessments"
          />
          <UiAppCheckbox
            v-model="notifications.taskReminders"
            label="Task reminders"
            description="Morning digest for due and overdue field work"
          />
          <UiAppCheckbox
            v-model="notifications.treatmentReminders"
            label="Treatment reminders"
            description="Follow-ups from disease treatment plans"
          />
          <UiAppCheckbox
            v-model="notifications.generalNotifications"
            label="General notifications"
            description="Product updates and workspace messages"
          />
        </div>
      </section>

      <div class="flex justify-end">
        <UiAppButton :loading="saving" @click="saveSettings"
          >Save settings</UiAppButton
        >
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { LandUnit, TemperatureUnit } from "~/types";

definePageMeta({ middleware: "auth" });
useHead({ title: "Settings" });

const { user, updateProfile, fetchMe } = useAuth();
const toast = useToast();

const saving = ref(false);
const formError = ref("");

const temperatureUnit = ref<TemperatureUnit>("celsius");
const landUnit = ref<LandUnit>("hectares");
const notifications = reactive({
  weatherAlerts: true,
  diseaseAlerts: true,
  taskReminders: true,
  treatmentReminders: true,
  generalNotifications: true,
});

const unitOptions = [
  { value: "hectares", label: "Hectares" },
  { value: "acres", label: "Acres" },
];
const tempOptions = [
  { value: "celsius", label: "Celsius (°C)" },
  { value: "fahrenheit", label: "Fahrenheit (°F)" },
];

function hydrate() {
  if (!user.value) return;
  temperatureUnit.value = user.value.preferences.temperatureUnit;
  landUnit.value = user.value.preferences.landUnit;
  Object.assign(notifications, user.value.preferences.notifications);
}

watch(user, hydrate, { immediate: true });

onMounted(async () => {
  if (!user.value) {
    try {
      await fetchMe();
    } catch {
      /* handled by middleware */
    }
  }
});

async function saveSettings() {
  formError.value = "";
  saving.value = true;
  try {
    await updateProfile({
      preferences: {
        temperatureUnit: temperatureUnit.value,
        landUnit: landUnit.value,
        notifications: { ...notifications },
      },
    });
    toast.success(
      "Settings saved",
      "Units and notification preferences updated.",
    );
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Unable to save settings";
  } finally {
    saving.value = false;
  }
}
</script>
