<template>
  <div ref="rootRef" class="relative w-full max-w-md">
    <label class="sr-only" for="admin-global-search"
      >Search users and conversations</label
    >
    <div class="relative">
      <UiAppIcon
        name="search"
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden="true"
      />
      <input
        id="admin-global-search"
        v-model="query"
        type="search"
        autocomplete="off"
        role="combobox"
        :aria-expanded="panelOpen"
        aria-controls="admin-global-search-results"
        aria-autocomplete="list"
        placeholder="Search users or conversations…"
        class="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        @focus="openPanel = true"
        @keydown.escape="closePanel"
        @keydown.down.prevent="moveHighlight(1)"
        @keydown.up.prevent="moveHighlight(-1)"
        @keydown.enter.prevent="selectHighlighted"
      />
    </div>

    <div
      v-if="panelOpen && (query.trim().length >= 2 || query.includes('@'))"
      id="admin-global-search-results"
      role="listbox"
      class="absolute z-50 mt-1 max-h-[min(24rem,60vh)] w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg"
    >
      <UiLoadingState v-if="loading" message="Searching…" class="p-4" />

      <template v-else>
        <section v-if="userResults.length" class="border-b border-line p-2">
          <p
            class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted"
          >
            Users
          </p>
          <button
            v-for="(user, index) in userResults"
            :key="user.id"
            type="button"
            role="option"
            class="admin-search-result"
            :class="{
              'admin-search-result--active':
                highlightedIndex === indexOffset('users', index),
            }"
            @mouseenter="highlightedIndex = indexOffset('users', index)"
            @click="goToUser(user.id)"
          >
            <span class="font-medium text-ink">{{ user.fullName }}</span>
            <span class="block truncate text-xs text-ink-secondary">{{
              user.email
            }}</span>
          </button>
        </section>

        <section v-if="conversationResults.length" class="p-2">
          <p
            class="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-muted"
          >
            Conversations
          </p>
          <button
            v-for="(conversation, index) in conversationResults"
            :key="conversation.id"
            type="button"
            role="option"
            class="admin-search-result"
            :class="{
              'admin-search-result--active':
                highlightedIndex === indexOffset('conversations', index),
            }"
            @mouseenter="highlightedIndex = indexOffset('conversations', index)"
            @click="goToConversation(conversation.id)"
          >
            <span class="font-medium text-ink">{{
              conversation.userName
            }}</span>
            <span class="block truncate text-xs text-ink-secondary">{{
              conversation.userEmail
            }}</span>
            <span class="mt-0.5 block font-mono text-[10px] text-ink-muted">{{
              conversation.id
            }}</span>
          </button>
        </section>

        <p
          v-if="!userResults.length && !conversationResults.length && !loading"
          class="px-4 py-6 text-center text-sm text-ink-muted"
        >
          No users or conversations matched “{{ query.trim() }}”.
        </p>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AdminUserListItem } from "~/types/admin";
import type { SupportConversation } from "~/types/support";
import { adminService } from "~/services/admin.service";

const query = ref("");
const openPanel = ref(false);
const loading = ref(false);
const userResults = ref<AdminUserListItem[]>([]);
const conversationResults = ref<SupportConversation[]>([]);
const highlightedIndex = ref(-1);
const rootRef = ref<HTMLElement | null>(null);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

const panelOpen = computed(() => openPanel.value);

const totalResults = computed(
  () => userResults.value.length + conversationResults.value.length,
);

function indexOffset(section: "users" | "conversations", index: number) {
  if (section === "users") return index;
  return userResults.value.length + index;
}

function closePanel() {
  openPanel.value = false;
  highlightedIndex.value = -1;
}

async function runSearch(value: string) {
  const trimmed = value.trim();
  if (trimmed.length < 2 && !trimmed.includes("@")) {
    userResults.value = [];
    conversationResults.value = [];
    return;
  }

  loading.value = true;
  try {
    const [users, conversations] = await Promise.all([
      adminService.listUsers({ search: trimmed, limit: 5 }),
      adminService.listConversations({ search: trimmed, limit: 5 }),
    ]);
    userResults.value = users.items;
    conversationResults.value = conversations.items;
    highlightedIndex.value =
      users.items.length + conversations.items.length > 0 ? 0 : -1;
  } catch {
    userResults.value = [];
    conversationResults.value = [];
  } finally {
    loading.value = false;
  }
}

function moveHighlight(delta: number) {
  if (!totalResults.value) return;
  if (highlightedIndex.value < 0) {
    highlightedIndex.value = 0;
    return;
  }
  highlightedIndex.value =
    (highlightedIndex.value + delta + totalResults.value) % totalResults.value;
}

function selectHighlighted() {
  if (highlightedIndex.value < 0) {
    void runSearch(query.value);
    return;
  }

  const userCount = userResults.value.length;
  if (highlightedIndex.value < userCount) {
    void goToUser(userResults.value[highlightedIndex.value].id);
    return;
  }

  const conversation =
    conversationResults.value[highlightedIndex.value - userCount];
  if (conversation) void goToConversation(conversation.id);
}

async function goToUser(uid: string) {
  closePanel();
  query.value = "";
  await navigateTo(`/admin/users/${uid}`);
}

async function goToConversation(conversationId: string) {
  closePanel();
  query.value = "";
  await navigateTo({
    path: "/admin/chats",
    query: { conversation: conversationId },
  });
}

watch(query, (value) => {
  openPanel.value = true;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    void runSearch(value);
  }, 280);
});

function handleDocumentClick(event: MouseEvent) {
  if (!openPanel.value) return;
  const target = event.target as Node;
  if (rootRef.value && !rootRef.value.contains(target)) {
    closePanel();
  }
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<style scoped>
.admin-search-result {
  display: block;
  width: 100%;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.5rem 0.625rem;
  text-align: left;
  transition: background 0.15s ease;
}

.admin-search-result:hover,
.admin-search-result--active {
  background: var(--color-canvas);
}

.admin-search-result:focus-visible {
  outline: 2px solid var(--color-brand-600);
  outline-offset: -2px;
}
</style>
