<template>
  <div class="admin-inbox-layout">
    <AdminSupportInboxSidebar
      class="admin-inbox-layout__list"
      :class="{ 'admin-inbox-layout__list--hidden': mobileThreadOpen }"
      :conversations="inbox.conversations.value"
      :selected-id="inbox.selectedId.value"
      :search="inbox.search.value"
      :filter="inbox.inboxFilter.value"
      :sort="inbox.inboxSort.value"
      :loading="inbox.loadingList.value"
      :loading-more="inbox.loadingMoreList.value"
      :has-more="inbox.listHasMore.value"
      @select="selectConversation"
      @search="reloadInbox"
      @load-more="loadMoreInbox"
      @update:search="inbox.search.value = $event"
      @update:filter="setFilter"
      @update:sort="setSort"
    />

    <AdminSupportInboxThread
      class="admin-inbox-layout__thread"
      :class="{ 'admin-inbox-layout__thread--hidden': !mobileThreadOpen }"
      :selected-id="inbox.selectedId.value"
      :conversation="inbox.activeConversation.value"
      :messages="inbox.messages.value"
      :history="inbox.userHistory.value"
      :current-thread="inbox.currentHistoryItem.value"
      :archived-threads="inbox.archivedHistory.value"
      :loading="inbox.loadingThread.value"
      :loading-history="inbox.loadingHistory.value"
      :loading-older="inbox.loadingOlder.value"
      :sending="inbox.sending.value"
      :clearing="inbox.clearing.value"
      :patching="inbox.patching.value"
      :read-only="inbox.isArchivedView.value"
      :has-more="inbox.hasMore.value"
      :thread-error="inbox.threadError.value"
      :on-send="inbox.sendReply"
      :on-retry="inbox.retryFailedMessage"
      @back="closeMobileThread"
      @load-older="inbox.loadOlderMessages()"
      @select-history="selectConversation"
      @patch-status="inbox.patchStatus($event)"
      @patch-priority="inbox.patchPriority($event)"
      @clear="handleClear"
      @retry-open="retryOpenThread"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  AdminInboxFilter,
  AdminInboxSort,
} from "~/composables/useAdminSupportInbox";

definePageMeta({ layout: "admin", middleware: ["auth", "admin"] });
useHead({ title: "Support inbox · Admin" });

const route = useRoute();
const { confirm } = useConfirm();
const inbox = useAdminSupportInbox();

const mobileThreadOpen = computed(() => Boolean(inbox.selectedId.value));

async function closeMobileThread() {
  await navigateTo({ path: "/admin/chats" }, { replace: true });
}

function reloadInbox() {
  void inbox.loadInbox(true);
}

function loadMoreInbox() {
  void inbox.loadInbox(false);
}

function setFilter(value: AdminInboxFilter) {
  inbox.inboxFilter.value = value;
  void inbox.loadInbox(true);
}

function setSort(value: AdminInboxSort) {
  inbox.inboxSort.value = value;
  void inbox.loadInbox(true);
}

async function selectConversation(conversationId: string) {
  if (route.query.conversation === conversationId) {
    void inbox.openThread(conversationId);
    return;
  }

  await navigateTo(
    { path: "/admin/chats", query: { conversation: conversationId } },
    { replace: true },
  );
}

function retryOpenThread() {
  const conversationId = inbox.selectedId.value;
  if (conversationId) {
    void inbox.openThread(conversationId);
  }
}

async function handleClear() {
  const ok = await confirm({
    title: "Clear this conversation?",
    message:
      "The current thread will be archived and preserved in history. A new empty conversation will start for this farmer.",
    confirmLabel: "Clear & archive",
    destructive: true,
  });
  if (!ok) return;

  try {
    const nextId = await inbox.clearThread();
    if (nextId) {
      await navigateTo({
        path: "/admin/chats",
        query: { conversation: nextId },
      });
    }
  } catch {
    // toast handled in composable
  }
}

watch(
  () => [route.query.conversation, route.query.user] as const,
  ([conversationId, userId]) => {
    if (typeof conversationId === "string" && conversationId) {
      void inbox.openThread(conversationId);
      return;
    }
    if (typeof userId === "string" && userId) {
      void inbox.resolveConversationFromUser(userId).then((id) => {
        if (id) {
          void navigateTo({
            path: "/admin/chats",
            query: { conversation: id },
          });
        }
      });
      return;
    }
    inbox.closeThread();
  },
  { immediate: true },
);

onMounted(() => {
  void inbox.loadInbox(true);
});

onBeforeUnmount(() => {
  inbox.dispose();
});
</script>

<style scoped>
.admin-inbox-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: calc(100vh - 8rem);
  min-height: 32rem;
  max-height: calc(100vh - 8rem);
  overflow: hidden;
}

.admin-inbox-layout__list,
.admin-inbox-layout__thread {
  min-height: 0;
}

@media (max-width: 1023px) {
  .admin-inbox-layout {
    gap: 0;
    width: calc(100% + 1.5rem);
    height: calc(100dvh - 3.25rem);
    min-height: 0;
    max-height: calc(100dvh - 3.25rem);
    margin: -0.625rem -0.75rem;
  }

  .admin-inbox-layout__list--hidden,
  .admin-inbox-layout__thread--hidden {
    display: none;
  }

  .admin-inbox-layout__list,
  .admin-inbox-layout__thread {
    flex: 1;
    width: 100%;
  }
}

@media (min-width: 1024px) {
  .admin-inbox-layout {
    flex-direction: row;
    align-items: stretch;
  }
}
</style>
