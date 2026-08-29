<template>
  <article
    class="rounded-md border px-3.5 py-3"
    :class="[
      notification.read
        ? 'border-line bg-white'
        : 'border-brand-200 bg-brand-50/40',
      compact ? '' : '',
    ]"
  >
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <UiStatusBadge
            :tone="notificationSeverityTone(notification.severity)"
          >
            {{ NOTIFICATION_TYPE_LABELS[notification.type] }}
          </UiStatusBadge>
          <span
            v-if="!notification.read"
            class="inline-flex h-1.5 w-1.5 rounded-full bg-brand-600"
            aria-label="Unread"
          />
        </div>
        <h3 class="mt-2 text-sm font-semibold text-ink">
          {{ notification.title }}
        </h3>
        <p class="type-body mt-1" :class="compact ? 'line-clamp-2' : ''">
          {{ notification.message }}
        </p>
        <p class="type-helper mt-2">{{ formatWhen(notification.createdAt) }}</p>
      </div>
    </div>

    <div class="mt-3 flex flex-wrap items-center gap-2">
      <NuxtLink
        v-if="notification.action"
        :to="notification.action.href"
        class="inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        @click="$emit('action', notification)"
      >
        {{ notification.action.label }}
      </NuxtLink>
      <UiAppButton
        v-if="!notification.read"
        size="sm"
        variant="secondary"
        :loading="markingRead"
        :disabled="markingRead || dismissing"
        @click="$emit('read', notification)"
      >
        Mark read
      </UiAppButton>
      <UiAppIconButton
        icon="trash-2"
        aria-label="Dismiss notification"
        title="Dismiss"
        variant="destructive"
        size="md"
        :loading="dismissing"
        :disabled="markingRead || dismissing"
        @click="$emit('dismiss', notification)"
      />
    </div>
  </article>
</template>

<script setup lang="ts">
import type { AppNotification } from "~/types/notification";
import {
  NOTIFICATION_TYPE_LABELS,
  notificationSeverityTone,
} from "~/types/notification";

defineProps<{
  notification: AppNotification;
  compact?: boolean;
  markingRead?: boolean;
  dismissing?: boolean;
}>();

defineEmits<{
  read: [notification: AppNotification];
  dismiss: [notification: AppNotification];
  action: [notification: AppNotification];
}>();

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
</script>
