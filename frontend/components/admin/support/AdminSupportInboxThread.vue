<template>
  <section
    class="admin-inbox-thread surface-card flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:h-[calc(100vh-8rem)] lg:min-h-[32rem]"
  >
    <UiEmptyState
      v-if="!selectedId"
      title="Select a conversation"
      description="Choose a farmer from the inbox to read messages and reply."
      class="m-auto hidden lg:flex"
    />

    <template v-else-if="loading">
      <div
        class="admin-inbox-thread__mobile-nav shrink-0 border-b border-line lg:hidden"
      >
        <button
          type="button"
          class="admin-inbox-thread__back"
          @click="$emit('back')"
        >
          <UiAppIcon name="chevron-left" class="h-5 w-5" />
          <span>Chats</span>
        </button>
      </div>
      <UiLoadingState message="Loading conversation…" class="flex-1" />
    </template>

    <template v-else-if="selectedId && !conversation">
      <div
        class="admin-inbox-thread__mobile-nav shrink-0 border-b border-line lg:hidden"
      >
        <button
          type="button"
          class="admin-inbox-thread__back"
          @click="$emit('back')"
        >
          <UiAppIcon name="chevron-left" class="h-5 w-5" />
          <span>Chats</span>
        </button>
      </div>
      <UiErrorState
        title="Unable to load conversation"
        :message="
          threadError ||
          'The conversation could not be opened. It may have been removed or you may not have access.'
        "
        retry-label="Try again"
        class="flex-1"
        @retry="$emit('retry-open')"
      />
    </template>

    <template v-else-if="conversation">
      <header class="shrink-0 border-b border-line px-3 py-2.5 lg:px-4 lg:py-3">
        <div
          class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"
        >
          <div
            class="flex min-w-0 items-center gap-1.5 lg:items-start lg:gap-2"
          >
            <button
              type="button"
              class="admin-inbox-thread__back admin-inbox-thread__back--icon lg:hidden"
              aria-label="Back to inbox"
              @click="$emit('back')"
            >
              <UiAppIcon name="chevron-left" class="h-5 w-5" />
            </button>

            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800"
            >
              {{ supportUserInitials(conversation.userName) }}
            </div>
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-ink">
                  {{ conversation.userName }}
                </h2>
                <UiStatusBadge
                  :tone="statusTone(conversation.status)"
                  compact
                  dot
                >
                  {{ conversation.status }}
                </UiStatusBadge>
                <UiStatusBadge
                  v-if="conversation.priority === 'high'"
                  tone="warning"
                  compact
                >
                  High priority
                </UiStatusBadge>
              </div>
              <p class="type-helper mt-0.5">{{ conversation.userEmail }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 pl-10 lg:pl-0">
            <NuxtLink :to="`/admin/users/${conversation.userId}`">
              <UiAppButton size="sm" variant="secondary"
                >View profile</UiAppButton
              >
            </NuxtLink>

            <div v-if="!readOnly" ref="menuRef" class="relative">
              <UiAppButton
                size="sm"
                variant="secondary"
                :loading="patching || clearing"
                @click="toggleMenu"
              >
                Actions
              </UiAppButton>
              <div v-if="menuOpen" class="admin-inbox-thread__menu" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  @click="runAction('pending')"
                >
                  Mark pending
                </button>
                <button
                  type="button"
                  role="menuitem"
                  @click="runAction('resolve')"
                >
                  Resolve
                </button>
                <button
                  type="button"
                  role="menuitem"
                  @click="runAction('reopen')"
                >
                  Reopen
                </button>
                <button
                  type="button"
                  role="menuitem"
                  @click="runAction('priority')"
                >
                  {{
                    conversation.priority === "high"
                      ? "Set normal priority"
                      : "Set high priority"
                  }}
                </button>
                <button
                  type="button"
                  role="menuitem"
                  class="admin-inbox-thread__menu-danger"
                  @click="runAction('clear')"
                >
                  Clear & archive
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="readOnly"
          class="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
        >
          Archived conversation, read-only. Messages here are kept separate from
          the current thread.
        </div>
      </header>

      <div class="shrink-0 border-b border-line bg-canvas/50 px-4 py-3">
        <div class="flex items-center justify-between gap-2">
          <p
            class="text-xs font-semibold uppercase tracking-wide text-ink-muted"
          >
            Conversation history
          </p>
          <span class="text-[10px] text-ink-muted"
            >{{ history.length }} thread(s)</span
          >
        </div>

        <UiLoadingState v-if="loadingHistory" message="Loading history…" />
        <div v-else class="mt-2 flex gap-2 overflow-x-auto pb-1">
          <button
            v-if="currentThread"
            type="button"
            class="admin-inbox-history-card shrink-0"
            :class="
              selectedId === currentThread.id
                ? 'admin-inbox-history-card--active'
                : ''
            "
            @click="$emit('select-history', currentThread.id)"
          >
            <UiStatusBadge tone="success" compact>Current</UiStatusBadge>
            <p class="mt-1 text-xs font-medium">
              {{ currentThread.messageCount ?? 0 }} messages
            </p>
            <p class="text-[10px] text-ink-muted">
              {{ formatSupportMessageTime(currentThread.lastMessageAt) }}
            </p>
          </button>

          <button
            v-for="item in archivedThreads"
            :key="item.id"
            type="button"
            class="admin-inbox-history-card shrink-0"
            :class="
              selectedId === item.id ? 'admin-inbox-history-card--active' : ''
            "
            @click="$emit('select-history', item.id)"
          >
            <UiStatusBadge tone="neutral" compact>Archived</UiStatusBadge>
            <p class="mt-1 text-xs font-medium">
              {{ item.messageCount ?? 0 }} messages
            </p>
            <p class="text-[10px] text-ink-muted">
              {{
                formatSupportMessageTime(item.archivedAt || item.lastMessageAt)
              }}
            </p>
          </button>

          <p v-if="!history.length" class="py-2 text-xs text-ink-muted">
            No conversation history yet.
          </p>
        </div>
      </div>

      <div
        ref="listRef"
        class="admin-inbox-thread__messages min-h-0 flex-1 overflow-y-auto px-4 py-3"
      >
        <div v-if="hasMore" class="flex justify-center pb-3">
          <UiAppButton
            variant="ghost"
            size="sm"
            :loading="loadingOlder"
            @click="$emit('load-older')"
          >
            Load older messages
          </UiAppButton>
        </div>

        <p
          v-if="!messages.length && !loadingOlder"
          class="py-8 text-center text-sm text-ink-muted"
        >
          No messages in this conversation yet.
        </p>

        <div
          v-for="message in messages"
          :key="message.id"
          class="admin-inbox-message-row"
          :class="
            message.senderType === 'user'
              ? 'admin-inbox-message-row--incoming'
              : 'admin-inbox-message-row--outgoing'
          "
        >
          <div
            class="admin-inbox-message"
            :class="{
              'admin-inbox-message--incoming': message.senderType === 'user',
              'admin-inbox-message--outgoing': message.senderType === 'admin',
              'admin-inbox-message--pending': message.pending,
              'admin-inbox-message--failed': message.failed,
            }"
          >
            <p class="whitespace-pre-wrap text-sm leading-relaxed">
              {{ message.text }}
            </p>
            <div class="admin-inbox-message__meta">
              <span>{{ formatSupportMessageTime(message.createdAt) }}</span>
              <span
                v-if="message.senderType === 'admin' && message.readByUserAt"
                class="text-ink-muted"
              >
                · Read by user
              </span>
              <span v-if="message.pending" class="text-ink-muted"
                >Sending…</span
              >
              <button
                v-else-if="message.failed"
                type="button"
                class="font-semibold text-danger"
                @click="retryMessage(message)"
              >
                Retry send
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="threadError"
        class="shrink-0 border-t border-danger/20 bg-danger/5 px-4 py-2 text-xs text-danger"
      >
        {{ threadError }}
      </div>

      <form
        v-if="!readOnly"
        class="shrink-0 border-t border-line p-3"
        @submit.prevent="submit"
      >
        <label class="sr-only" for="admin-support-reply">Reply to farmer</label>
        <div class="flex items-end gap-2">
          <SupportChatComposerTextarea
            id="admin-support-reply"
            ref="composerRef"
            v-model="draft"
            variant="admin"
            :fixed-rows="3"
            aria-label="Reply to farmer"
            placeholder="Write a reply… (Enter to send, Shift+Enter for new line)"
            :disabled="sending || clearing || patching"
            @keydown="handleComposerKeydown"
          />
          <UiAppButton
            type="submit"
            :loading="sending"
            :disabled="!draft.trim() || sending || clearing || patching"
          >
            Send
          </UiAppButton>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
import type { SupportConversation, SupportMessage } from "~/types/support";
import {
  formatSupportMessageTime,
  supportUserInitials,
} from "~/composables/useAdminSupportInbox";

const props = defineProps<{
  selectedId: string | null;
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  history: SupportConversation[];
  currentThread: SupportConversation | null;
  archivedThreads: SupportConversation[];
  loading: boolean;
  loadingHistory: boolean;
  loadingOlder: boolean;
  sending: boolean;
  clearing: boolean;
  patching: boolean;
  readOnly: boolean;
  hasMore: boolean;
  threadError: string;
  onSend: (text: string) => Promise<void>;
  onRetry: (message: SupportMessage) => Promise<void>;
}>();

const emit = defineEmits<{
  back: [];
  "load-older": [];
  "select-history": [conversationId: string];
  "patch-status": [status: "open" | "pending" | "resolved"];
  "patch-priority": [priority: "normal" | "high"];
  "retry-open": [];
  clear: [];
}>();

const draft = ref("");
const listRef = ref<HTMLElement | null>(null);
const composerRef = ref<{ focus: () => void } | null>(null);
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function statusTone(status: SupportConversation["status"]) {
  if (status === "open") return "success";
  if (status === "pending") return "warning";
  if (status === "resolved") return "neutral";
  return "neutral";
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

function closeMenu() {
  menuOpen.value = false;
}

async function runAction(
  action: "pending" | "resolve" | "reopen" | "priority" | "clear",
) {
  closeMenu();
  if (action === "pending") emit("patch-status", "pending");
  if (action === "resolve") emit("patch-status", "resolved");
  if (action === "reopen") emit("patch-status", "open");
  if (action === "priority") {
    emit(
      "patch-priority",
      props.conversation?.priority === "high" ? "normal" : "high",
    );
  }
  if (action === "clear") emit("clear");
}

function handleComposerKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  void submit();
}

async function submit() {
  const text = draft.value.trim();
  if (!text || props.sending) return;
  try {
    await props.onSend(text);
    draft.value = "";
    void scrollToBottom();
  } catch {
    // Parent/composable surfaces error; draft preserved for retry.
  }
}

async function retryMessage(message: SupportMessage) {
  try {
    await props.onRetry(message);
  } catch {
    // failed state remains on bubble
  }
}

async function scrollToBottom() {
  await nextTick();
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight;
  }
}

watch(
  () => props.messages.length,
  () => {
    void scrollToBottom();
  },
);

watch(
  () => props.selectedId,
  () => {
    draft.value = "";
    closeMenu();
    void scrollToBottom();
    composerRef.value?.focus();
  },
);

function handleDocumentClick(event: MouseEvent) {
  if (!menuOpen.value) return;
  const target = event.target as Node;
  if (menuRef.value && !menuRef.value.contains(target)) {
    closeMenu();
  }
}

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<style scoped>
.admin-inbox-thread {
  border-radius: var(--radius-md);
}

@media (max-width: 1023px) {
  .admin-inbox-thread {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
  }
}

.admin-inbox-thread__mobile-nav {
  padding: 0.5rem 0.75rem;
}

.admin-inbox-thread__back {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border: 0;
  background: transparent;
  padding: 0.25rem 0.375rem 0.25rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-brand);
  cursor: pointer;
}

.admin-inbox-thread__back--icon {
  width: 2.75rem;
  height: 2.75rem;
  flex-shrink: 0;
  justify-content: center;
  padding: 0;
}

.admin-inbox-thread__back:focus-visible {
  outline: 2px solid var(--color-brand);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

.admin-inbox-thread__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 5;
  min-width: 12rem;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 20, 0.12);
}

.admin-inbox-thread__menu button {
  display: block;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border: 0;
  border-radius: calc(var(--radius-md) - 2px);
  background: transparent;
  text-align: left;
  font-size: 0.8125rem;
  color: var(--color-ink);
  cursor: pointer;
}

.admin-inbox-thread__menu button:hover {
  background: var(--color-canvas);
}

.admin-inbox-thread__menu-danger {
  color: var(--color-danger) !important;
}

.admin-inbox-history-card {
  min-width: 8.5rem;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.admin-inbox-history-card:hover {
  border-color: #a8cbb5;
}

.admin-inbox-history-card--active {
  border-color: var(--color-brand-600);
  background: #f3f8f5;
}

.admin-inbox-thread__messages {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(180deg, #f3f7f4 0%, #f8faf9 12%, #f8faf9 100%);
  scrollbar-width: thin;
  scrollbar-color: rgba(26, 77, 46, 0.45) transparent;
}

.admin-inbox-thread__messages::-webkit-scrollbar {
  width: 6px;
}

.admin-inbox-thread__messages::-webkit-scrollbar-track {
  margin: 4px 0;
  background: transparent;
}

.admin-inbox-thread__messages::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(95, 138, 106, 0.5),
    rgba(26, 77, 46, 0.7)
  );
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.admin-inbox-thread__messages::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(95, 138, 106, 0.7),
    rgba(26, 77, 46, 0.85)
  );
}

.admin-inbox-message-row {
  display: flex;
  width: 100%;
}

.admin-inbox-message-row--incoming {
  justify-content: flex-start;
}

.admin-inbox-message-row--outgoing {
  justify-content: flex-end;
}

.admin-inbox-message {
  max-width: min(85%, 22rem);
  border-radius: 1rem;
  padding: 0.625rem 0.875rem;
}

.admin-inbox-message--incoming {
  background: #fff;
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 0.35rem;
}

.admin-inbox-message--outgoing {
  background: linear-gradient(180deg, #dce9e1 0%, #d0e2d7 100%);
  border: 1px solid #b8d4c4;
  border-bottom-right-radius: 0.35rem;
}

.admin-inbox-message--pending {
  opacity: 0.72;
}

.admin-inbox-message--failed {
  border-color: #f1b4ae;
  background: #fff5f4;
}

.admin-inbox-message__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin-top: 0.35rem;
  font-size: 0.6875rem;
  color: var(--color-ink-muted);
}
</style>
