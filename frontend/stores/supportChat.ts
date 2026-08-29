import {
  OPTIMISTIC_MESSAGE_PREFIX,
  SYSTEM_GREETING_ID,
} from "~/constants/supportChat";
import type { SupportConversation, SupportMessage } from "~/types/support";
import { supportChatService } from "~/services/supportChat.service";
import { startChatPolling } from "~/lib/chatPolling";

interface SupportChatState {
  open: boolean;
  conversation: SupportConversation | null;
  messages: SupportMessage[];
  greeting: string;
  unreadCount: number;
  loading: boolean;
  loadFailed: boolean;
  loadingOlder: boolean;
  sending: boolean;
  clearing: boolean;
  error: string;
  pollingConversationId: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

let stopPoll: (() => void) | null = null;
let stopUnreadPoll: (() => void) | null = null;

function stopPolling() {
  stopPoll?.();
  stopPoll = null;
}

function stopUnreadPolling() {
  stopUnreadPoll?.();
  stopUnreadPoll = null;
}

function isPersistedMessage(message: SupportMessage) {
  return (
    message.id !== SYSTEM_GREETING_ID &&
    !message.id.startsWith(OPTIMISTIC_MESSAGE_PREFIX)
  );
}

function mergeMessages(
  incoming: SupportMessage[],
  existing: SupportMessage[],
): SupportMessage[] {
  const optimistic = existing.filter(
    (m) => m.id.startsWith(OPTIMISTIC_MESSAGE_PREFIX) && !m.failed,
  );
  if (!optimistic.length) return incoming;

  const remainingOptimistic = optimistic.filter((pending) => {
    return !incoming.some(
      (real) =>
        real.senderType === "user" &&
        real.text === pending.text &&
        Math.abs(
          new Date(real.createdAt).getTime() -
            new Date(pending.createdAt).getTime(),
        ) < 60_000,
    );
  });

  return [...incoming, ...remainingOptimistic].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export const useSupportChatStore = defineStore("supportChat", {
  state: (): SupportChatState => ({
    open: false,
    conversation: null,
    messages: [],
    greeting: "",
    unreadCount: 0,
    loading: false,
    loadFailed: false,
    loadingOlder: false,
    sending: false,
    clearing: false,
    error: "",
    pollingConversationId: null,
    nextCursor: null,
    hasMore: false,
  }),

  getters: {
    realMessages(state): SupportMessage[] {
      return state.messages.filter(isPersistedMessage);
    },
    showWelcome(): boolean {
      return !this.loading && !this.loadFailed && this.messages.length === 0;
    },
  },

  actions: {
    async bootstrapUnread() {
      try {
        const data = await supportChatService.unreadCount();
        this.unreadCount = data.unreadCount;
      } catch {
        // Non-blocking for app shell.
      }
    },

    async openPanel() {
      this.open = true;
      this.error = "";
      await this.loadConversation(true);
    },

    closePanel() {
      this.open = false;
      stopPolling();
      this.pollingConversationId = null;
      if (this.conversation?.id) {
        this.startUnreadPolling(this.conversation.id);
      } else {
        void this.bootstrapUnread();
      }
    },

    async retryLoad() {
      await this.loadConversation(this.open);
    },

    async loadConversation(markRead = false) {
      this.loading = true;
      this.loadFailed = false;
      this.error = "";
      try {
        const data = await supportChatService.getCurrentConversation();
        this.conversation = data.conversation;
        this.greeting = data.greeting;

        const page = await supportChatService.listMessages(
          data.conversation.id,
          { limit: 50 },
        );
        this.messages = page.items;
        this.nextCursor = page.nextCursor;
        this.hasMore = page.hasMore;

        if (this.open) {
          this.startMessagePolling(data.conversation.id);
        } else {
          this.startUnreadPolling(data.conversation.id);
        }

        if (markRead && this.unreadCount > 0) {
          await this.markRead();
        }
      } catch (err) {
        this.loadFailed = true;
        this.error =
          err instanceof Error ? err.message : "Unable to load support chat";
      } finally {
        this.loading = false;
      }
    },

    startUnreadPolling(conversationId: string) {
      stopUnreadPolling();
      stopPolling();
      this.pollingConversationId = conversationId;
      stopUnreadPoll = startChatPolling(async () => {
        if (this.pollingConversationId !== conversationId || this.open) return;
        await this.bootstrapUnread();
      }, 15_000);
    },

    startMessagePolling(conversationId: string) {
      if (this.pollingConversationId === conversationId && stopPoll) return;
      stopPolling();
      stopUnreadPolling();
      this.pollingConversationId = conversationId;

      const refresh = async () => {
        if (this.pollingConversationId !== conversationId || !this.open) return;
        try {
          const page = await supportChatService.listMessages(conversationId, {
            limit: 50,
          });
          if (this.pollingConversationId !== conversationId) return;
          this.messages = mergeMessages(page.items, this.messages);
          this.nextCursor = page.nextCursor;
          this.hasMore = page.hasMore;

          const unread = await supportChatService.unreadCount();
          this.unreadCount = unread.unreadCount;
          if (this.unreadCount > 0) {
            await this.markRead();
          }
        } catch {
          // Keep last loaded messages visible.
        }
      };

      stopPoll = startChatPolling(refresh);
    },

    async loadOlderMessages() {
      if (
        !this.conversation?.id ||
        !this.hasMore ||
        !this.nextCursor ||
        this.loadingOlder
      )
        return;
      this.loadingOlder = true;
      try {
        const page = await supportChatService.listMessages(
          this.conversation.id,
          {
            cursor: this.nextCursor,
            limit: 50,
          },
        );
        const older = page.items;
        const current = this.messages.filter(isPersistedMessage);
        this.messages = mergeMessages([...older, ...current], this.messages);
        this.nextCursor = page.nextCursor;
        this.hasMore = page.hasMore;
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Unable to load older messages";
      } finally {
        this.loadingOlder = false;
      }
    },

    async sendMessage(text: string) {
      if (!this.conversation?.id) return;
      const trimmed = text.trim();
      if (!trimmed || this.sending) return;

      const tempId = `${OPTIMISTIC_MESSAGE_PREFIX}${crypto.randomUUID()}`;
      const optimistic: SupportMessage = {
        id: tempId,
        conversationId: this.conversation.id,
        senderId: "local",
        senderType: "user",
        text: trimmed,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      this.messages = [...this.messages.filter(isPersistedMessage), optimistic];
      this.sending = true;
      this.error = "";

      try {
        await supportChatService.sendMessage(this.conversation.id, trimmed);
        this.messages = this.messages.filter((m) => m.id !== tempId);
        if (this.conversation?.id) {
          const page = await supportChatService.listMessages(
            this.conversation.id,
            { limit: 50 },
          );
          this.messages = mergeMessages(page.items, this.messages);
        }
      } catch (err) {
        this.messages = this.messages.map((m) =>
          m.id === tempId ? { ...m, pending: false, failed: true } : m,
        );
        this.error =
          err instanceof Error ? err.message : "Unable to send message";
        throw err;
      } finally {
        this.sending = false;
      }
    },

    async markRead() {
      if (!this.conversation?.id) return;
      try {
        await supportChatService.markRead(this.conversation.id);
        this.unreadCount = 0;
      } catch {
        // ignore
      }
    },

    async clearConversation() {
      if (!this.conversation?.id || this.clearing) return;
      this.clearing = true;
      this.error = "";
      const previousId = this.conversation.id;
      try {
        stopPolling();
        this.pollingConversationId = null;
        const next = await supportChatService.clearConversation(previousId);
        this.conversation = next;
        this.unreadCount = 0;
        this.messages = [];
        this.nextCursor = null;
        this.hasMore = false;
        if (this.open) {
          this.startMessagePolling(next.id);
        }
      } catch (err) {
        this.error =
          err instanceof Error ? err.message : "Unable to clear conversation";
        if (this.conversation?.id === previousId && this.open) {
          this.startMessagePolling(previousId);
        }
        throw err;
      } finally {
        this.clearing = false;
      }
    },

    reset() {
      stopPolling();
      stopUnreadPolling();
      this.$reset();
    },
  },
});
