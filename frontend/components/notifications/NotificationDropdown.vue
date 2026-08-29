<template>
  <div class="relative" ref="root">
    <button
      type="button"
      class="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md"
      :class="
        buttonClass || 'border border-line text-ink-secondary hover:bg-canvas'
      "
      aria-label="Notifications"
      :aria-expanded="open"
      @click="toggle"
    >
      <UiNavIcon name="bell" :class="iconClass" />
      <span
        v-if="unreadCount > 0"
        class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
      >
        {{ unreadCount > 9 ? "9+" : unreadCount }}
      </span>
    </button>

    <div
      v-if="open"
      class="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-white shadow-card max-sm:fixed max-sm:inset-x-3 max-sm:top-[calc(var(--header-height)+0.25rem)] max-sm:z-50 max-sm:mt-0 max-sm:w-auto"
      role="dialog"
      aria-label="Notification center"
    >
      <div
        class="flex items-center justify-between border-b border-line px-3 py-2.5"
      >
        <p class="text-sm font-semibold text-ink">Notifications</p>
        <UiAppButton
          v-if="unreadCount > 0"
          size="sm"
          variant="secondary"
          :loading="markingAllRead"
          @click="onMarkAll"
        >
          Mark all read
        </UiAppButton>
      </div>

      <div class="max-h-80 overflow-y-auto p-2">
        <template v-if="isInitialLoad">
          <div class="space-y-2 p-1">
            <UiTableRowSkeleton v-for="n in 3" :key="n" compact />
          </div>
        </template>
        <template v-else-if="previewItems.length">
          <div class="relative space-y-2">
            <div
              v-if="refreshing"
              class="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center py-1"
              aria-hidden="true"
            >
              <span
                class="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-r-transparent"
              />
            </div>
            <NotificationsNotificationItem
              v-for="item in previewItems"
              :key="item.id"
              :notification="item"
              compact
              :marking-read="
                pendingActionId === item.id && pendingActionType === 'read'
              "
              :dismissing="
                pendingActionId === item.id && pendingActionType === 'dismiss'
              "
              @read="onRead"
              @dismiss="onDismiss"
              @action="open = false"
            />
          </div>
        </template>
        <UiEmptyState
          v-else
          class="py-6"
          title="You're all caught up"
          description="Field alerts and reminders will show here."
        />
      </div>

      <div class="border-t border-line px-3 py-2">
        <NuxtLink
          to="/notifications"
          class="block text-center text-sm font-semibold text-brand-700 hover:underline"
          @click="open = false"
        >
          View all notifications
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useNotificationStore } from "~/stores/notifications";
import type { AppNotification } from "~/types/notification";
import { getAuthToken } from "~/services/authToken";

defineProps<{ buttonClass?: string; iconClass?: string }>();

const toast = useToast();
const store = useNotificationStore();
const {
  items,
  unreadCount,
  status,
  refreshing,
  markingAllRead,
  pendingActionId,
  pendingActionType,
  isInitialLoad,
} = storeToRefs(store);

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const previewItems = computed(() => items.value.slice(0, 5));

async function toggle() {
  open.value = !open.value;
  if (open.value) {
    try {
      const token = await getAuthToken();
      await store.refresh(token);
    } catch (err) {
      toast.error(
        "Could not load notifications",
        err instanceof Error ? err.message : "Try again",
      );
    }
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
  } catch (err) {
    toast.error(
      "Could not mark all as read",
      err instanceof Error ? err.message : "Try again",
    );
  }
}

function onDocClick(event: MouseEvent) {
  if (!root.value?.contains(event.target as Node)) open.value = false;
}

onMounted(() => {
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});
</script>
