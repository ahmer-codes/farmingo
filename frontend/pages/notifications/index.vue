<template>
  <div class="space-y-6">
    <header
      class="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-5"
    >
      <div>
        <h2 class="type-page-title">Notifications</h2>
        <p class="type-body mt-1">
          Alerts from weather risks, disease assessments, tasks, and treatment
          follow-ups.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UiAppButton
          v-if="unreadCount > 0"
          size="sm"
          variant="secondary"
          :loading="markingAllRead"
          :disabled="refreshing"
          @click="onMarkAll"
        >
          Mark all read
        </UiAppButton>
        <UiAppButton variant="ghost" :loading="refreshing" @click="onRefresh">
          <UiAppIcon v-if="!refreshing" name="refresh-cw" />
          Refresh
        </UiAppButton>
      </div>
    </header>

    <template v-if="isInitialLoad">
      <div class="space-y-2">
        <UiTableRowSkeleton v-for="n in 5" :key="n" show-meta />
      </div>
    </template>

    <UiErrorState
      v-else-if="status === 'error' && !items.length"
      :message="error || 'Unable to load notifications'"
      retry-label="Try again"
      @retry="load"
    />

    <template v-else>
      <div class="relative">
        <div
          v-if="refreshing"
          class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
          aria-hidden="true"
        >
          <span
            class="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-secondary shadow-card"
          >
            <span
              class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
            />
            Refreshing…
          </span>
        </div>

        <div :class="{ 'opacity-60': refreshing }">
          <div
            class="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden"
          >
            <button
              v-for="filter in filters"
              :key="filter.value"
              type="button"
              class="inline-flex h-10 shrink-0 items-center rounded-md border px-3 text-sm font-medium md:h-auto md:py-1.5"
              :class="
                activeFilter === filter.value
                  ? 'border-brand-600 bg-brand-50 text-brand-800'
                  : 'border-line bg-white text-ink-secondary hover:bg-canvas'
              "
              :aria-pressed="activeFilter === filter.value"
              @click="activeFilter = filter.value"
            >
              {{ filter.label }}
            </button>
          </div>

          <div v-if="filtered.length" class="mt-2 space-y-2">
            <NotificationsNotificationItem
              v-for="item in filtered"
              :key="item.id"
              :notification="item"
              :marking-read="
                pendingActionId === item.id && pendingActionType === 'read'
              "
              :dismissing="
                pendingActionId === item.id && pendingActionType === 'dismiss'
              "
              @read="onRead"
              @dismiss="onDismiss"
            />
          </div>
          <UiEmptyState
            v-else
            title="No notifications in this view"
            description="When Farmingo detects field risks or due treatments, they will appear here."
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useNotificationStore } from "~/stores/notifications";
import type { AppNotification, NotificationType } from "~/types/notification";
import { getAuthToken } from "~/services/authToken";

definePageMeta({ middleware: "auth" });
useHead({ title: "Notifications" });

const toast = useToast();
const store = useNotificationStore();
const {
  items,
  unreadCount,
  status,
  error,
  refreshing,
  markingAllRead,
  pendingActionId,
  pendingActionType,
  isInitialLoad,
} = storeToRefs(store);

type FilterValue = "all" | "unread" | NotificationType;

const activeFilter = ref<FilterValue>("all");

const filters: Array<{ value: FilterValue; label: string }> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "weather_alert", label: "Weather" },
  { value: "task_reminder", label: "Tasks" },
  { value: "overdue_task", label: "Overdue" },
  { value: "disease_alert", label: "Disease" },
  { value: "treatment_followup", label: "Treatment" },
];

const filtered = computed(() => {
  if (activeFilter.value === "all") return items.value;
  if (activeFilter.value === "unread")
    return items.value.filter((n) => !n.read);
  return items.value.filter((n) => n.type === activeFilter.value);
});

async function load() {
  try {
    const token = await getAuthToken();
    await store.refresh(token);
  } catch (err) {
    if (items.value.length) {
      toast.error(
        "Could not refresh notifications",
        err instanceof Error ? err.message : "Try again",
      );
    }
  }
}

async function onRefresh() {
  try {
    const token = await getAuthToken();
    await store.refresh(token, { force: true });
  } catch (err) {
    toast.error(
      "Could not refresh notifications",
      err instanceof Error ? err.message : "Try again",
    );
  }
}

async function onRead(notification: AppNotification) {
  try {
    const token = await getAuthToken();
    await store.markRead(token, notification.id);
  } catch (err) {
    toast.error(
      "Could not mark as read",
      err instanceof Error ? err.message : "Try again",
    );
  }
}

async function onDismiss(notification: AppNotification) {
  try {
    const token = await getAuthToken();
    await store.dismiss(token, notification.id);
  } catch (err) {
    toast.error(
      "Could not dismiss notification",
      err instanceof Error ? err.message : "Try again",
    );
  }
}

async function onMarkAll() {
  try {
    const token = await getAuthToken();
    await store.markAllRead(token);
    toast.success("All notifications marked as read");
  } catch (err) {
    toast.error(
      "Could not mark all as read",
      err instanceof Error ? err.message : "Try again",
    );
  }
}

useAuthReadyLoad(load);
</script>
