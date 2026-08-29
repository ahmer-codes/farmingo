<template>
  <UiModalScrim @close="$emit('close')">
    <div
      class="flex max-h-[90vh] w-full max-w-lg flex-col overflow-y-auto rounded-md border border-line bg-white p-5 shadow-card"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="type-section">Create task</h2>
          <p class="type-helper mt-1">
            Add a field task for your farm workspace.
          </p>
        </div>
        <UiAppIconButton
          icon="x"
          aria-label="Close"
          title="Close"
          @click="$emit('close')"
        />
      </div>

      <form class="mt-5 space-y-3" @submit.prevent="submit">
        <UiAppInput v-model="form.title" label="Title" required />
        <label class="block space-y-1.5">
          <span class="block text-sm font-medium text-ink">Description</span>
          <textarea
            v-model="form.description"
            rows="3"
            required
            class="w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </label>
        <div class="grid gap-3 sm:grid-cols-2">
          <UiAppInput v-model="form.crop" label="Crop" required />
          <UiAppInput
            v-model="form.field"
            label="Field"
            placeholder="Optional"
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <UiAppInput
            v-model="form.dueDate"
            label="Date"
            type="date"
            required
          />
          <UiAppInput
            v-model="form.dueTime"
            label="Time"
            type="time"
            required
          />
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <UiAppSelect
            v-model="form.priority"
            label="Priority"
            :options="priorityOptions"
          />
          <UiAppInput
            v-model="form.reminderTime"
            label="Reminder"
            type="time"
          />
        </div>

        <UiErrorState
          v-if="error"
          :message="error"
          title="Could not create task"
        />

        <div
          class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"
        >
          <UiAppButton
            type="button"
            variant="secondary"
            class="w-full sm:w-auto"
            @click="$emit('close')"
          >
            Cancel
          </UiAppButton>
          <UiAppButton
            type="submit"
            class="w-full sm:w-auto"
            :loading="loading"
          >
            Create task
          </UiAppButton>
        </div>
      </form>
    </div>
  </UiModalScrim>
</template>

<script setup lang="ts">
import type { CreateWorkTaskPayload } from "~/types";

const props = defineProps<{ loading?: boolean; error?: string }>();
const emit = defineEmits<{
  close: [];
  submit: [payload: CreateWorkTaskPayload];
}>();

useOverlayEscape({
  active: true,
  onClose: () => emit("close"),
  blocked: () => props.loading ?? false,
});

const today = new Date().toISOString().slice(0, 10);

const form = reactive({
  title: "",
  description: "",
  crop: "",
  field: "",
  dueDate: today,
  dueTime: "08:00",
  priority: "medium",
  reminderTime: "07:30",
});

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function submit() {
  emit("submit", {
    title: form.title.trim(),
    description: form.description.trim(),
    crop: form.crop.trim(),
    field: form.field.trim() || undefined,
    dueDate: form.dueDate,
    dueTime: form.dueTime,
    priority: form.priority as CreateWorkTaskPayload["priority"],
    reminderTime: form.reminderTime || undefined,
    source: "farmer_created",
  });
}
</script>
