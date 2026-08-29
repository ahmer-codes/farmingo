<template>
  <div class="space-y-6">
    <UiPageHeroBanner
      :image-src="tasksHeroImage"
      eyebrow="Field work"
      title="Tasks & treatment plans"
      description="Convert disease and weather recommendations into actionable field work, fertilizing, spraying, scouting, and seasonal jobs."
    >
      <template #actions>
        <UiAppButton
          size="sm"
          class="!border-white/25 !bg-white/10 !text-white hover:!bg-white/15"
          @click="showCreate = true"
        >
          <UiAppIcon name="plus" size="sm" />
          New task
        </UiAppButton>
      </template>
    </UiPageHeroBanner>

    <TasksTaskFilters v-model="filter" />

    <div
      v-if="isInitialLoad"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
      aria-busy="true"
      aria-label="Loading task summary"
    >
      <UiStatCardSkeleton v-for="n in 4" :key="n" />
    </div>
    <div
      v-else-if="summary"
      class="grid grid-cols-2 gap-3 lg:grid-cols-4"
      :class="{ 'opacity-60': isFilterLoading }"
    >
      <FarmStatCard
        label="Today"
        :value="String(summary.today)"
        helper="Due today"
      />
      <FarmStatCard
        label="Upcoming"
        :value="String(summary.upcoming)"
        helper="Scheduled ahead"
      />
      <FarmStatCard
        label="Overdue"
        :value="String(summary.overdue)"
        helper="Needs attention"
        :delta="summary.overdue ? 'Act soon' : undefined"
        :delta-tone="summary.overdue ? 'negative' : 'neutral'"
      />
      <FarmStatCard
        label="Completed"
        :value="String(summary.completed)"
        helper="All time in list"
      />
    </div>

    <div
      v-if="planLoading"
      class="surface-card p-4"
      aria-busy="true"
      aria-label="Loading treatment plan"
    >
      <UiSkeleton height="sm" width="md" />
      <UiSkeleton class="mt-3" height="md" width="full" />
    </div>
    <div
      v-else-if="planError && activePlanId"
      class="surface-card border-danger/30 bg-danger-soft/30 p-4"
    >
      <p class="text-sm font-medium text-danger">
        Could not load treatment plan
      </p>
      <p class="type-helper mt-1">{{ planError }}</p>
    </div>
    <TasksTreatmentPlanProgress v-else-if="activePlan" :plan="activePlan" />

    <template v-if="isInitialLoad">
      <div class="space-y-2" aria-busy="true" aria-label="Loading tasks">
        <UiTableRowSkeleton v-for="n in 5" :key="n" />
      </div>
    </template>

    <UiErrorState
      v-else-if="fetchError"
      :message="fetchError"
      retry-label="Try again"
      @retry="load"
    />

    <template v-else>
      <div class="relative space-y-6">
        <div
          v-if="isFilterLoading"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center pt-2"
          aria-hidden="true"
        >
          <span
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-secondary shadow-card"
          >
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
            />
            Updating tasks…
          </span>
        </div>

        <div :class="{ 'opacity-60': isFilterLoading }">
          <template
            v-if="
              filter === 'all' ||
              filter === 'today' ||
              filter === 'upcoming' ||
              filter === 'overdue'
            "
          >
            <section v-if="showTodaySection" class="space-y-3">
              <UiSectionHeader
                title="Today"
                description="Tasks due today."
                bordered
              />
              <div v-if="todayTasks.length" class="space-y-2">
                <TasksTaskCard
                  v-for="task in todayTasks"
                  :key="task.id"
                  :task="task"
                  @select="openTask"
                />
              </div>
              <UiEmptyState
                v-else
                :image-src="tasksClearDayImage"
                title="Nothing due today"
                description="You're clear for today, check upcoming work or create a new task."
              >
                <template #action>
                  <UiAppButton size="sm" @click="showCreate = true">
                    <UiAppIcon name="plus" size="sm" />
                    Create task
                  </UiAppButton>
                </template>
              </UiEmptyState>
            </section>

            <section v-if="showUpcomingSection" class="space-y-3">
              <UiSectionHeader
                title="Upcoming"
                description="Scheduled for the days ahead."
                bordered
              />
              <div v-if="upcomingTasks.length" class="space-y-2">
                <TasksTaskCard
                  v-for="task in upcomingTasks"
                  :key="task.id"
                  :task="task"
                  @select="openTask"
                />
              </div>
              <UiEmptyState
                v-else
                :image-src="tasksUpcomingEmptyImage"
                title="No upcoming tasks"
                description="New treatment plans and seasonal recommendations will appear here."
              />
            </section>

            <section
              v-if="showOverdueSection && overdueTasks.length"
              class="space-y-3"
            >
              <UiSectionHeader
                title="Overdue"
                description="Past-due work that still needs action."
                bordered
              />
              <div class="space-y-2">
                <TasksTaskCard
                  v-for="task in overdueTasks"
                  :key="task.id"
                  :task="task"
                  @select="openTask"
                />
              </div>
            </section>
          </template>

          <section v-else class="space-y-3">
            <UiSectionHeader :title="filterTitle" bordered />
            <div v-if="tasks.length" class="space-y-2">
              <TasksTaskCard
                v-for="task in tasks"
                :key="task.id"
                :task="task"
                @select="openTask"
              />
            </div>
            <UiEmptyState
              v-else
              title="No tasks in this filter"
              description="Try another filter or create a custom field task."
            >
              <template #action>
                <UiAppButton size="sm" @click="showCreate = true">
                  <UiAppIcon name="plus" size="sm" />
                  Create task
                </UiAppButton>
              </template>
            </UiEmptyState>
          </section>
        </div>
      </div>
    </template>

    <TasksTaskDetailDrawer
      :task="selectedTask"
      :completing="pendingAction === 'complete'"
      :starting="pendingAction === 'start'"
      :skipping="pendingAction === 'skip'"
      :deleting="pendingAction === 'delete'"
      :saving-schedule="pendingAction === 'schedule'"
      @close="selectedTask = null"
      @complete="onComplete"
      @start="onStart"
      @skip="onSkip"
      @delete="onDelete"
      @update-schedule="onUpdateSchedule"
    />

    <TasksTaskCreateModal
      v-if="showCreate"
      :loading="creating"
      :error="createError"
      @close="showCreate = false"
      @submit="onCreate"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  CreateWorkTaskPayload,
  TaskListFilter,
  TaskListResponse,
  TreatmentPlan,
  WorkTask,
} from "~/types";
import { taskService } from "~/services";
import type { AsyncState } from "~/types";
import { useAuthStore } from "~/stores/auth";
import { invalidateDashboardCache } from "~/utils/sessionCache";
import {
  filterOverdueTasks,
  filterTodayTasks,
  filterUpcomingTasks,
  todayIsoDate,
} from "~/utils/taskGrouping";
import { getAuthToken } from "~/services/authToken";
import {
  tasksClearDayImage,
  tasksHeroImage,
  tasksUpcomingEmptyImage,
} from "~/utils/cropImages";

definePageMeta({ middleware: "auth" });
useHead({ title: "Tasks" });

const route = useRoute();
const authStore = useAuthStore();
const { isReady } = useAuth();
const toast = useToast();
const { confirm } = useConfirm();

const REFRESH_ERROR_MSG =
  "Task updated, but we couldn't refresh the latest data.";

function invalidateDashboardOverviewCache() {
  invalidateDashboardCache(authStore.firebaseUser?.uid);
}

const filter = ref<TaskListFilter>("all");
const state = ref<AsyncState>("idle");
const fetchError = ref("");
const tasks = ref<WorkTask[]>([]);
const summary = ref<TaskListResponse["summary"] | null>(null);
const selectedTask = ref<WorkTask | null>(null);
const activePlan = ref<TreatmentPlan | null>(null);
const planLoading = ref(false);
const planError = ref("");

const showCreate = ref(false);
const creating = ref(false);
const createError = ref("");
const pendingAction = ref<
  "complete" | "start" | "skip" | "delete" | "schedule" | null
>(null);

let loadRequestId = 0;

const isInitialLoad = computed(
  () => !isReady.value || (state.value === "loading" && !tasks.value.length),
);
const isFilterLoading = computed(
  () => state.value === "loading" && tasks.value.length > 0,
);

const activePlanId = computed(() =>
  typeof route.query.plan === "string" ? route.query.plan : null,
);

const today = computed(() => todayIsoDate());

const todayTasks = computed(() => filterTodayTasks(tasks.value, today.value));
const upcomingTasks = computed(() =>
  filterUpcomingTasks(tasks.value, today.value),
);
const overdueTasks = computed(() =>
  filterOverdueTasks(tasks.value, today.value),
);

const showTodaySection = computed(
  () => filter.value === "all" || filter.value === "today",
);
const showUpcomingSection = computed(
  () => filter.value === "all" || filter.value === "upcoming",
);
const showOverdueSection = computed(
  () => filter.value === "all" || filter.value === "overdue",
);

const filterTitle = computed(() => {
  const map: Record<string, string> = {
    completed: "Completed tasks",
    disease_treatment: "Disease treatment tasks",
    weather_precaution: "Weather precaution tasks",
    farmer_created: "Custom tasks",
    seasonal_recommendation: "Seasonal recommendations",
  };
  return map[filter.value] || "Tasks";
});

async function authTokenOrReturn(): Promise<string | null> {
  try {
    return await getAuthToken();
  } catch {
    return null;
  }
}

async function load(options: { quiet?: boolean } = {}) {
  const token = await authTokenOrReturn();
  if (!token) return;
  const hasTasks = tasks.value.length > 0;
  const requestId = ++loadRequestId;

  if (!options.quiet) {
    state.value = "loading";
    if (!hasTasks) fetchError.value = "";
  }

  try {
    const listFilter =
      filter.value === "all" ||
      filter.value === "today" ||
      filter.value === "upcoming"
        ? "all"
        : filter.value;
    const data = await taskService.list(token, listFilter);
    if (requestId !== loadRequestId) return;

    tasks.value = data.tasks;
    summary.value = data.summary;
    state.value = data.tasks.length ? "success" : "empty";
    fetchError.value = "";
  } catch (err) {
    if (requestId !== loadRequestId) return;

    if (!hasTasks) {
      state.value = "error";
      fetchError.value =
        err instanceof Error ? err.message : "Unable to load tasks";
    } else if (options.quiet) {
      throw err;
    } else {
      state.value = "success";
      toast.error(
        "Could not refresh tasks",
        err instanceof Error ? err.message : "Try again",
      );
    }
  }
}

async function loadPlan(planId: string) {
  const token = await authTokenOrReturn();
  if (!token) return;

  planLoading.value = true;
  planError.value = "";
  try {
    activePlan.value = await taskService.getPlan(token, planId);
  } catch (err) {
    activePlan.value = null;
    planError.value =
      err instanceof Error ? err.message : "Unable to load treatment plan";
    toast.error("Could not load treatment plan", planError.value);
  } finally {
    planLoading.value = false;
  }
}

async function refreshAfterMutation(taskId?: string) {
  const token = await authTokenOrReturn();
  if (!token) return;

  if (taskId && selectedTask.value?.id === taskId) {
    try {
      selectedTask.value = await taskService.get(token, taskId);
    } catch {
      // Keep drawer open with stale task data if single-task refresh fails.
    }
  }

  await load({ quiet: true });

  if (activePlan.value) {
    try {
      activePlan.value = await taskService.getPlan(token, activePlan.value.id);
    } catch {
      // Plan refresh failure is non-critical after mutation.
    }
  }
}

async function runTaskMutation(
  action: NonNullable<typeof pendingAction.value>,
  mutate: () => Promise<void>,
  successMessage: string,
  failureMessage: string,
  taskId?: string,
) {
  if (pendingAction.value) return;
  pendingAction.value = action;
  try {
    await mutate();
    invalidateDashboardOverviewCache();
    toast.success(successMessage);
    try {
      await refreshAfterMutation(taskId);
    } catch {
      toast.error(REFRESH_ERROR_MSG);
    }
  } catch (err) {
    toast.error(
      failureMessage,
      err instanceof Error ? err.message : "Try again",
    );
  } finally {
    pendingAction.value = null;
  }
}

function openTask(task: WorkTask) {
  selectedTask.value = task;
}

async function onComplete(id: string) {
  const token = await authTokenOrReturn();
  if (!token) return;
  await runTaskMutation(
    "complete",
    () => taskService.complete(token, id),
    "Task completed",
    "Could not complete task",
    id,
  );
}

async function onStart(id: string) {
  const token = await authTokenOrReturn();
  if (!token) return;
  await runTaskMutation(
    "start",
    () => taskService.update(token, id, { status: "in_progress" }),
    "Task started",
    "Could not start task",
    id,
  );
}

async function onSkip(id: string) {
  const token = await authTokenOrReturn();
  if (!token) return;
  await runTaskMutation(
    "skip",
    () => taskService.update(token, id, { status: "skipped" }),
    "Task skipped",
    "Could not skip task",
    id,
  );
}

async function onDelete(id: string) {
  const token = await authTokenOrReturn();
  if (!token || pendingAction.value) return;
  const ok = await confirm({
    title: "Delete this task?",
    message: "This permanently removes the task from your work list.",
    confirmLabel: "Delete task",
    destructive: true,
  });
  if (!ok) return;

  pendingAction.value = "delete";
  try {
    await taskService.remove(token, id);
    selectedTask.value = null;
    invalidateDashboardOverviewCache();
    toast.success("Task deleted");
    try {
      await load({ quiet: true });
    } catch {
      toast.error(REFRESH_ERROR_MSG);
    }
  } catch (err) {
    toast.error(
      "Could not delete task",
      err instanceof Error ? err.message : "Try again",
    );
  } finally {
    pendingAction.value = null;
  }
}

async function onUpdateSchedule(payload: {
  id: string;
  dueDate: string;
  dueTime: string;
}) {
  const token = await authTokenOrReturn();
  if (!token) return;
  await runTaskMutation(
    "schedule",
    () =>
      taskService.update(token, payload.id, {
        dueDate: payload.dueDate,
        dueTime: payload.dueTime,
      }),
    "Schedule updated",
    "Could not update schedule",
    payload.id,
  );
}

async function onCreate(payload: CreateWorkTaskPayload) {
  const token = await authTokenOrReturn();
  if (!token) return;
  creating.value = true;
  createError.value = "";
  try {
    await taskService.create(token, payload);
    showCreate.value = false;
    invalidateDashboardOverviewCache();
    toast.success("Task created", payload.title);
    try {
      await load({ quiet: true });
    } catch {
      toast.error(REFRESH_ERROR_MSG);
    }
  } catch (err) {
    createError.value =
      err instanceof Error ? err.message : "Unable to create task";
  } finally {
    creating.value = false;
  }
}

watch(filter, () => {
  if (isReady.value) void load();
});

watch(
  activePlanId,
  (planId) => {
    if (!isReady.value) return;
    if (planId) {
      loadPlan(planId);
    } else {
      activePlan.value = null;
      planError.value = "";
      planLoading.value = false;
    }
  },
  { immediate: true },
);

useAuthReadyLoad(load);
</script>
