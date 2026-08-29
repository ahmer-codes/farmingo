<template>
  <div
    v-if="task"
    class="fixed inset-0 z-50 flex justify-end bg-ink/40"
    @click.self="$emit('close')"
  >
    <aside class="flex h-full w-full max-w-lg flex-col bg-white shadow-card">
      <header
        class="flex items-start justify-between gap-3 border-b border-line px-5 py-4"
      >
        <div class="min-w-0 pr-2">
          <p class="type-label">Task details</p>
          <h2 class="type-section mt-1">{{ task.title }}</h2>
        </div>
        <UiAppIconButton
          icon="x"
          aria-label="Close"
          title="Close"
          @click="$emit('close')"
        />
      </header>

      <div class="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <div class="flex flex-wrap gap-2">
          <UiStatusBadge :tone="statusTone">{{ statusLabel }}</UiStatusBadge>
          <UiStatusBadge tone="neutral">{{ sourceLabel }}</UiStatusBadge>
          <UiStatusBadge tone="brand" class="capitalize"
            >{{ task.priority }} priority</UiStatusBadge
          >
        </div>

        <section>
          <h3 class="type-card-title">Why this was recommended</h3>
          <p class="type-body mt-1">
            {{ task.reason || "No recommendation reason recorded." }}
          </p>
        </section>

        <section>
          <h3 class="type-card-title">Instructions</h3>
          <p class="type-body mt-1">
            {{ task.instructions || task.description }}
          </p>
        </section>

        <dl
          class="grid grid-cols-2 gap-3 rounded-md border border-line p-3 text-sm"
        >
          <div>
            <dt class="type-label">Crop</dt>
            <dd class="mt-1 font-medium text-ink">{{ task.crop }}</dd>
          </div>
          <div>
            <dt class="type-label">Field</dt>
            <dd class="mt-1 font-medium text-ink">{{ task.field }}</dd>
          </div>
          <div>
            <dt class="type-label">Related problem</dt>
            <dd class="mt-1 font-medium text-ink">
              {{ task.relatedDisease || "-" }}
            </dd>
          </div>
          <div>
            <dt class="type-label">Duration</dt>
            <dd class="mt-1 font-medium text-ink">
              {{ task.estimatedDurationMinutes }} min
            </dd>
          </div>
          <div>
            <dt class="type-label">Due date</dt>
            <dd class="mt-1 font-medium text-ink">{{ task.dueDate }}</dd>
          </div>
          <div>
            <dt class="type-label">Due time</dt>
            <dd class="mt-1 font-medium text-ink">{{ task.dueTime }}</dd>
          </div>
          <div>
            <dt class="type-label">Reminder</dt>
            <dd class="mt-1 font-medium text-ink">
              {{ task.reminderTime || "-" }}
            </dd>
          </div>
          <div>
            <dt class="type-label">Source</dt>
            <dd class="mt-1 font-medium text-ink">{{ sourceLabel }}</dd>
          </div>
        </dl>

        <section
          v-if="canEditSchedule"
          class="space-y-3 rounded-md border border-line p-3"
        >
          <h3 class="type-card-title">Modify schedule</h3>
          <div class="grid grid-cols-2 gap-3">
            <UiAppInput v-model="editDate" label="Due date" type="date" />
            <UiAppInput v-model="editTime" label="Due time" type="time" />
          </div>
          <UiAppButton
            variant="secondary"
            :loading="savingSchedule"
            @click="saveSchedule"
          >
            Save schedule
          </UiAppButton>
        </section>
      </div>

      <footer class="flex flex-wrap gap-2 border-t border-line px-5 py-4">
        <UiAppButton
          v-if="task.status !== 'completed'"
          :loading="completing"
          :disabled="anyActionLoading && !completing"
          @click="$emit('complete', task.id)"
        >
          Mark complete
        </UiAppButton>
        <UiAppButton
          v-if="task.status === 'pending'"
          variant="secondary"
          :loading="starting"
          :disabled="anyActionLoading && !starting"
          @click="$emit('start', task.id)"
        >
          Start
        </UiAppButton>
        <UiAppButton
          v-if="task.status !== 'skipped' && task.status !== 'completed'"
          variant="ghost"
          :loading="skipping"
          :disabled="anyActionLoading && !skipping"
          @click="$emit('skip', task.id)"
        >
          Skip
        </UiAppButton>
        <UiAppButton
          variant="destructive"
          :loading="deleting"
          :disabled="anyActionLoading && !deleting"
          @click="$emit('delete', task.id)"
        >
          <UiAppIcon v-if="!deleting" name="trash-2" />
          Delete
        </UiAppButton>
      </footer>
    </aside>
  </div>
</template>

<script setup lang="ts">
import type { WorkTask } from "~/types";
import { TASK_SOURCE_LABELS, TASK_STATUS_LABELS } from "~/types";

const props = defineProps<{
  task: WorkTask | null;
  completing?: boolean;
  starting?: boolean;
  skipping?: boolean;
  deleting?: boolean;
  savingSchedule?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  complete: [id: string];
  start: [id: string];
  skip: [id: string];
  delete: [id: string];
  "update-schedule": [
    payload: { id: string; dueDate: string; dueTime: string },
  ];
}>();

const editDate = ref("");
const editTime = ref("");

watch(
  () => props.task,
  (task) => {
    if (!task) return;
    editDate.value = task.dueDate;
    editTime.value = task.dueTime;
  },
  { immediate: true },
);

const statusLabel = computed(() =>
  props.task ? TASK_STATUS_LABELS[props.task.status] : "",
);
const sourceLabel = computed(() =>
  props.task ? TASK_SOURCE_LABELS[props.task.source] : "",
);

const statusTone = computed(() => {
  if (!props.task) return "neutral" as const;
  if (props.task.status === "overdue") return "danger" as const;
  if (props.task.status === "in_progress") return "info" as const;
  if (props.task.status === "completed") return "success" as const;
  return "neutral" as const;
});

const canEditSchedule = computed(
  () =>
    props.task &&
    props.task.status !== "completed" &&
    props.task.status !== "skipped",
);

const anyActionLoading = computed(() =>
  Boolean(
    props.completing ||
      props.starting ||
      props.skipping ||
      props.deleting ||
      props.savingSchedule,
  ),
);

function saveSchedule() {
  if (!props.task) return;
  emit("update-schedule", {
    id: props.task.id,
    dueDate: editDate.value,
    dueTime: editTime.value,
  });
}
</script>
