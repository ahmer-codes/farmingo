<script setup lang="ts">
import { storeToRefs } from "pinia";
import {
  SUPPORT_QUICK_PROMPTS,
  SUPPORT_WELCOME_SUBTITLE,
  SUPPORT_WELCOME_TITLE,
} from "~/constants/supportChat";
import type { SupportMessage } from "~/types/support";
import { useSupportChatStore } from "~/stores/supportChat";

const props = defineProps<{
  returnFocus?: HTMLElement | { value: HTMLElement | null } | null;
}>();

const emit = defineEmits<{ close: [] }>();

const store = useSupportChatStore();
const {
  messages,
  loading,
  loadFailed,
  loadingOlder,
  sending,
  clearing,
  error,
  hasMore,
  showWelcome,
} = storeToRefs(store);

const toast = useToast();
const { confirm } = useConfirm();

const draft = ref("");
const listRef = ref<HTMLElement | null>(null);
const composerRef = ref<{ focus: () => void } | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const menuOpen = ref(false);
const menuRef = ref<HTMLElement | null>(null);

function formatMessageTime(value: string) {
  const date = new Date(value);
  const now = new Date();
  const sameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function isUserMessage(message: SupportMessage) {
  return message.senderType === "user";
}

async function scrollToBottom() {
  await nextTick();
  if (listRef.value) {
    listRef.value.scrollTop = listRef.value.scrollHeight;
  }
}

watch(
  () => messages.value.length,
  () => {
    void scrollToBottom();
  },
);

watch(
  () => loading.value,
  (isLoading) => {
    if (!isLoading && !loadFailed.value) {
      void scrollToBottom();
      composerRef.value?.focus();
    }
  },
);

function handleComposerKeydown(event: KeyboardEvent) {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  void submit();
}

async function submit(textOverride?: string) {
  const text = (textOverride ?? draft.value).trim();
  if (!text || sending.value || clearing.value || loading.value) return;

  if (!textOverride) {
    draft.value = "";
  }

  try {
    await store.sendMessage(text);
    void scrollToBottom();
  } catch {
    if (!textOverride) {
      draft.value = text;
    }
  }
}

async function sendQuickPrompt(prompt: string) {
  await submit(prompt);
}

function closeMenu() {
  menuOpen.value = false;
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value;
}

async function clearChat() {
  closeMenu();
  const ok = await confirm({
    title: "Clear this conversation?",
    message:
      "Your current conversation will be archived and a new conversation will start.",
    confirmLabel: "Clear conversation",
    destructive: true,
  });
  if (!ok) return;

  try {
    await store.clearConversation();
    toast.success("Conversation cleared");
    draft.value = "";
    void scrollToBottom();
    composerRef.value?.focus();
  } catch {
    toast.error(store.error || "Unable to clear conversation");
  }
}

function handleClose() {
  closeMenu();
  emit("close");
  const target =
    props.returnFocus && "value" in props.returnFocus
      ? props.returnFocus.value
      : props.returnFocus;
  target?.focus();
}

function handleDocumentClick(event: MouseEvent) {
  if (!menuOpen.value) return;
  const target = event.target as Node;
  if (menuRef.value && !menuRef.value.contains(target)) {
    closeMenu();
  }
}

useOverlayEscape({
  active: () => !menuOpen.value,
  onClose: handleClose,
});

useOverlayEscape({
  active: () => menuOpen.value,
  onClose: closeMenu,
});

onMounted(() => {
  document.addEventListener("click", handleDocumentClick);
  panelRef.value?.focus();
  if (!loading.value && !loadFailed.value) {
    composerRef.value?.focus();
  }
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleDocumentClick);
});
</script>

<template>
  <section
    ref="panelRef"
    class="support-panel"
    role="dialog"
    aria-modal="true"
    aria-labelledby="support-panel-title"
    tabindex="-1"
  >
    <header class="support-panel__header">
      <div class="support-panel__header-main">
        <div class="support-panel__avatar" aria-hidden="true">
          <UiAppIcon name="life-buoy" size="md" />
        </div>
        <div class="min-w-0">
          <p id="support-panel-title" class="support-panel__title">
            Farmingo Support
          </p>
          <p class="support-panel__status">Text-only support chat</p>
        </div>
      </div>

      <div class="support-panel__header-actions">
        <div ref="menuRef" class="relative">
          <UiAppIconButton
            icon="more-vertical"
            size="md"
            aria-label="Support chat menu"
            :disabled="loading || clearing"
            @click="toggleMenu"
          />
          <div v-if="menuOpen" class="support-panel__menu" role="menu">
            <button
              type="button"
              class="support-panel__menu-item support-panel__menu-item--danger"
              role="menuitem"
              :disabled="clearing || loading"
              @click="clearChat"
            >
              Clear conversation
            </button>
          </div>
        </div>
        <UiAppIconButton
          icon="x"
          size="md"
          aria-label="Close support chat"
          @click="handleClose"
        />
      </div>
    </header>

    <div
      ref="listRef"
      class="support-panel__messages"
      aria-live="polite"
      aria-relevant="additions"
    >
      <UiLoadingState v-if="loading" message="Loading conversation…" />

      <div v-else-if="loadFailed" class="support-panel__center-state">
        <UiAppIcon name="alert-triangle" class="h-8 w-8 text-danger" />
        <p class="support-panel__state-title">Unable to load chat</p>
        <p class="support-panel__state-text">
          {{ error || "Please check your connection and try again." }}
        </p>
        <UiAppButton variant="secondary" size="sm" @click="store.retryLoad()"
          >Retry</UiAppButton
        >
      </div>

      <template v-else>
        <div v-if="hasMore" class="flex justify-center pb-2">
          <UiAppButton
            variant="ghost"
            size="sm"
            :loading="loadingOlder"
            @click="store.loadOlderMessages()"
          >
            Load older messages
          </UiAppButton>
        </div>

        <div v-if="showWelcome" class="support-welcome">
          <p class="support-welcome__title">{{ SUPPORT_WELCOME_TITLE }}</p>
          <p class="support-welcome__subtitle">
            {{ SUPPORT_WELCOME_SUBTITLE }}
          </p>
          <div class="support-welcome__prompts">
            <button
              v-for="prompt in SUPPORT_QUICK_PROMPTS"
              :key="prompt"
              type="button"
              class="support-welcome__prompt"
              :disabled="sending || clearing"
              @click="sendQuickPrompt(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <div
          v-for="message in messages"
          :key="message.id"
          class="support-message-row"
          :class="
            isUserMessage(message)
              ? 'support-message-row--user'
              : 'support-message-row--admin'
          "
        >
          <div
            class="support-message"
            :class="{
              'support-message--user': isUserMessage(message),
              'support-message--admin': !isUserMessage(message),
              'support-message--pending': message.pending,
              'support-message--failed': message.failed,
            }"
          >
            <p class="support-message__text whitespace-pre-wrap">
              {{ message.text }}
            </p>
            <div class="support-message__meta">
              <span>{{ formatMessageTime(message.createdAt) }}</span>
              <span v-if="message.pending" class="support-message__state"
                >Sending…</span
              >
              <span
                v-else-if="message.failed"
                class="support-message__state support-message__state--failed"
              >
                Failed to send
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>

    <div v-if="error && !loadFailed" class="support-panel__error" role="alert">
      <UiAppIcon name="alert-triangle" size="sm" />
      <span class="flex-1">{{ error }}</span>
      <UiAppButton variant="ghost" size="sm" @click="store.retryLoad()">
        Retry
      </UiAppButton>
    </div>

    <form class="support-panel__composer" @submit.prevent="submit()">
      <label class="sr-only" for="support-chat-input"
        >Message Farmingo support</label
      >
      <SupportChatComposerTextarea
        id="support-chat-input"
        ref="composerRef"
        v-model="draft"
        variant="fab"
        aria-label="Message Farmingo support"
        placeholder="Type your message…"
        :disabled="sending || clearing || loading || loadFailed"
        @keydown="handleComposerKeydown"
      />
      <UiAppIconButton
        icon="send"
        type="submit"
        size="md"
        variant="default"
        aria-label="Send message"
        :loading="sending"
        :disabled="
          !draft.trim() || sending || clearing || loading || loadFailed
        "
        class="support-panel__send"
      />
    </form>
  </section>
</template>

<style scoped>
.support-panel {
  position: fixed;
  z-index: 46;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--color-border);
  outline: none;
}

@media (max-width: 1023px) {
  .support-panel {
    left: 0;
    right: 0;
    bottom: var(--bottom-nav-height);
    width: 100%;
    height: min(
      560px,
      calc(100vh - var(--header-height) - var(--bottom-nav-height))
    );
    max-height: min(85vh, calc(100vh - var(--bottom-nav-height)));
    border-radius: 1rem 1rem 0 0;
    box-shadow: 0 -10px 40px rgba(15, 23, 20, 0.16);
  }
}

@media (min-width: 1024px) {
  .support-panel {
    right: 1.5rem;
    bottom: calc(1.5rem + 3.5rem + 0.75rem);
    width: min(400px, calc(100vw - 2rem));
    height: min(560px, calc(100vh - var(--header-height) - 4rem));
    max-height: 600px;
    border-radius: 1rem;
    box-shadow:
      0 16px 48px rgba(15, 23, 20, 0.14),
      0 4px 12px rgba(15, 23, 20, 0.08);
  }
}

.support-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-bottom: 1px solid var(--color-border);
  background: linear-gradient(180deg, #f7fbf8 0%, #fff 100%);
}

.support-panel__header-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.support-panel__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: #e8f2ec;
  color: #1a4d2e;
  flex-shrink: 0;
}

.support-panel__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.3;
}

.support-panel__status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.125rem;
  font-size: 0.75rem;
  color: var(--color-ink-secondary);
}

.support-panel__status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: #9aa8a0;
}

.support-panel__status-dot--connected {
  background: #1a7f4b;
}

.support-panel__status-dot--connecting {
  background: #d4a017;
  animation: support-status-pulse 1.2s ease-in-out infinite;
}

.support-panel__status-dot--disconnected {
  background: #b42318;
}

.support-panel__header-actions {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
}

.support-panel__menu {
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  min-width: 11rem;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 20, 0.12);
  z-index: 2;
}

.support-panel__menu-item {
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

.support-panel__menu-item:hover:not(:disabled) {
  background: var(--color-canvas);
}

.support-panel__menu-item--danger {
  color: var(--color-danger);
}

.support-panel__menu-item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.support-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: linear-gradient(180deg, #f3f7f4 0%, #f8faf9 12%, #f8faf9 100%);
}

.support-panel__center-state {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 1.5rem 1rem;
  text-align: center;
}

.support-panel__state-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.support-panel__state-text {
  max-width: 16rem;
  font-size: 0.8125rem;
  color: var(--color-ink-secondary);
}

.support-welcome {
  margin-bottom: 0.25rem;
  padding: 0.875rem;
  border-radius: var(--radius-md);
  background: #fff;
  border: 1px solid #dbe7df;
}

.support-welcome__title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--color-ink);
}

.support-welcome__subtitle {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--color-ink-secondary);
}

.support-welcome__prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.875rem;
}

.support-welcome__prompt {
  padding: 0.45rem 0.7rem;
  border-radius: 9999px;
  border: 1px solid #c8dccf;
  background: #f3f8f5;
  font-size: 0.75rem;
  color: #1a4d2e;
  transition:
    background 0.15s ease,
    border-color 0.15s ease;
}

.support-welcome__prompt:hover:not(:disabled) {
  background: #e8f2ec;
  border-color: #a8cbb5;
}

.support-welcome__prompt:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.support-message-row {
  display: flex;
  width: 100%;
}

.support-message-row--user {
  justify-content: flex-end;
}

.support-message-row--admin {
  justify-content: flex-start;
}

.support-message {
  max-width: min(88%, 18rem);
  border-radius: 1rem;
  padding: 0.625rem 0.8rem;
}

.support-message--admin {
  background: #fff;
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 0.35rem;
}

.support-message--user {
  background: linear-gradient(180deg, #e6f0ea 0%, #dce9e1 100%);
  border: 1px solid #c3d8ca;
  border-bottom-right-radius: 0.35rem;
}

.support-message--pending {
  opacity: 0.72;
}

.support-message--failed {
  border-color: #f1b4ae;
  background: #fff5f4;
}

.support-message__text {
  font-size: 0.875rem;
  line-height: 1.45;
  color: var(--color-ink);
}

.support-message__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
  margin-top: 0.35rem;
  font-size: 0.6875rem;
  color: var(--color-ink-muted);
}

.support-message__state--failed {
  color: var(--color-danger);
  font-weight: 600;
}

.support-panel__error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.875rem;
  border-top: 1px solid #f1d0cc;
  background: #fff6f5;
  font-size: 0.8125rem;
  color: #8f2f26;
}

.support-panel__composer {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding: 0.75rem;
  border-top: 1px solid var(--color-border);
  background: #fff;
}

.support-panel__send {
  background: #1a4d2e !important;
  border-color: #1a4d2e !important;
  color: #fff !important;
}

.support-panel__send:hover:not(:disabled) {
  background: #143d24 !important;
}

@keyframes support-status-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
