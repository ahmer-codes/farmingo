<template>
  <aside
    class="admin-inbox-sidebar surface-card flex h-full min-h-0 flex-col overflow-hidden lg:h-[calc(100vh-8rem)] lg:min-h-[32rem]"
  >
    <div class="border-b border-line p-4">
      <h1 class="text-lg font-semibold text-ink">Support inbox</h1>
      <p class="type-helper mt-0.5">
        Farmer conversations, current threads only
      </p>

      <div class="relative mt-3">
        <UiAppIcon
          name="search"
          class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        />
        <input
          :value="search"
          type="search"
          placeholder="Search name, email, or conversation ID…"
          class="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm"
          @input="
            $emit('update:search', ($event.target as HTMLInputElement).value)
          "
          @keyup.enter="$emit('search')"
        />
      </div>

      <div
        class="mt-3 flex flex-wrap gap-1.5"
        role="group"
        aria-label="Inbox filters"
      >
        <button
          v-for="option in ADMIN_INBOX_FILTER_OPTIONS"
          :key="option.value"
          type="button"
          class="rounded-full border px-2.5 py-1 text-[11px] font-medium transition"
          :class="
            filter === option.value
              ? 'border-brand-600 bg-brand-50 text-brand-700'
              : 'border-line bg-white text-ink-secondary hover:border-brand-200'
          "
          @click="$emit('update:filter', option.value)"
        >
          {{ option.label }}
        </button>
      </div>

      <label class="mt-3 flex flex-col gap-1">
        <span class="type-label">Sort</span>
        <select
          :value="sort"
          class="rounded-md border border-line bg-white px-2 py-1.5 text-xs"
          @change="
            $emit(
              'update:sort',
              ($event.target as HTMLSelectElement).value as AdminInboxSort,
            )
          "
        >
          <option
            v-for="option in ADMIN_INBOX_SORT_OPTIONS"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
      </label>
    </div>

    <UiLoadingState v-if="loading" message="Loading inbox…" class="flex-1" />

    <div v-else class="flex-1 overflow-y-auto">
      <button
        v-for="item in conversations"
        :key="item.id"
        type="button"
        class="admin-inbox-item block w-full border-b border-line/80 px-4 py-3 text-left transition"
        :class="
          selectedId === item.id ? 'bg-brand-50/80' : 'hover:bg-canvas/70'
        "
        @click="$emit('select', item.id)"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800"
            aria-hidden="true"
          >
            {{ supportUserInitials(item.userName) }}
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-ink">
                  {{ item.userName }}
                </p>
                <p class="truncate text-xs text-ink-secondary">
                  {{ item.userEmail }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span class="text-[10px] text-ink-muted">{{
                  formatSupportMessageTime(item.lastMessageAt)
                }}</span>
                <span
                  v-if="item.unreadCountAdmin > 0"
                  class="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  {{ item.unreadCountAdmin }}
                </span>
              </div>
            </div>

            <p class="mt-1 line-clamp-2 text-xs text-ink-muted">
              {{ item.lastMessageText || "No messages yet" }}
            </p>

            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <UiStatusBadge :tone="statusTone(item.status)" compact>{{
                item.status
              }}</UiStatusBadge>
              <UiStatusBadge
                v-if="item.priority === 'high'"
                tone="warning"
                compact
              >
                High priority
              </UiStatusBadge>
              <span
                v-if="item.assignedAdminId"
                class="text-[10px] text-ink-muted"
              >
                · {{ shortAdminId(item.assignedAdminId) }}
              </span>
            </div>
          </div>
        </div>
      </button>

      <UiEmptyState
        v-if="!conversations.length"
        title="No conversations"
        description="Try another filter or search term."
      />

      <div v-if="hasMore" class="flex justify-center p-3">
        <UiAppButton
          variant="ghost"
          size="sm"
          :loading="loadingMore"
          @click="$emit('load-more')"
        >
          Load more
        </UiAppButton>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { SupportConversation } from "~/types/support";
import type {
  AdminInboxFilter,
  AdminInboxSort,
} from "~/composables/useAdminSupportInbox";
import {
  ADMIN_INBOX_FILTER_OPTIONS,
  ADMIN_INBOX_SORT_OPTIONS,
  formatSupportMessageTime,
  supportUserInitials,
} from "~/composables/useAdminSupportInbox";

defineProps<{
  conversations: SupportConversation[];
  selectedId: string | null;
  search: string;
  filter: AdminInboxFilter;
  sort: AdminInboxSort;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
}>();

defineEmits<{
  select: [conversationId: string];
  search: [];
  "load-more": [];
  "update:search": [value: string];
  "update:filter": [value: AdminInboxFilter];
  "update:sort": [value: AdminInboxSort];
}>();

function shortAdminId(value: string) {
  return value.length > 10 ? `Admin ${value.slice(0, 6)}…` : `Admin ${value}`;
}

function statusTone(status: SupportConversation["status"]) {
  if (status === "open") return "success";
  if (status === "pending") return "warning";
  if (status === "resolved") return "neutral";
  return "neutral";
}
</script>

<style scoped>
.admin-inbox-sidebar {
  width: 100%;
}

@media (min-width: 1024px) {
  .admin-inbox-sidebar {
    width: 360px;
    min-width: 360px;
    border-radius: var(--radius-md);
  }
}

@media (max-width: 1023px) {
  .admin-inbox-sidebar {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
}

.admin-inbox-item:focus-visible {
  outline: 2px solid var(--color-brand-600);
  outline-offset: -2px;
}
</style>
