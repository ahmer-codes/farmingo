import {
  OPTIMISTIC_MESSAGE_PREFIX,
  SYSTEM_GREETING_ID,
} from "~/constants/supportChat";
import type { SupportConversation, SupportMessage } from "~/types/support";
import { adminService } from "~/services/admin.service";
import { startChatPolling } from "~/lib/chatPolling";
import { formatRelativePast } from "~/utils/adminUserFormat";

export type AdminInboxFilter =
  | "all"
  | "unread"
  | "open"
  | "pending"
  | "resolved"
  | "high";
export type AdminInboxSort = "activity" | "unread" | "priority";

export const ADMIN_INBOX_FILTER_OPTIONS: Array<{
  value: AdminInboxFilter;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "open", label: "Open" },
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "high", label: "High priority" },
];

export const ADMIN_INBOX_SORT_OPTIONS: Array<{
  value: AdminInboxSort;
  label: string;
}> = [
  { value: "activity", label: "Newest activity" },
  { value: "unread", label: "Unread first" },
  { value: "priority", label: "Priority first" },
];

function mergeMessages(incoming: SupportMessage[], existing: SupportMessage[]) {
  const optimistic = existing.filter(
    (m) => m.id.startsWith(OPTIMISTIC_MESSAGE_PREFIX) && !m.failed,
  );
  if (!optimistic.length) return incoming;

  const remainingOptimistic = optimistic.filter((pending) => {
    return !incoming.some(
      (real) =>
        real.senderType === "admin" &&
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

function inboxFilterToQuery(filter: AdminInboxFilter) {
  switch (filter) {
    case "unread":
      return { unreadOnly: true as const };
    case "open":
      return { status: "open" as const };
    case "pending":
      return { status: "pending" as const };
    case "resolved":
      return { status: "resolved" as const };
    case "high":
      return { priority: "high" as const };
    default:
      return {};
  }
}

export function formatSupportMessageTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60_000) return "Just now";
  if (diffMs < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  return formatRelativePast(value);
}

export function supportUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) || "?").toUpperCase();
}

export function useAdminSupportInbox() {
  const toast = useToast();

  const conversations = ref<SupportConversation[]>([]);
  const userHistory = ref<SupportConversation[]>([]);
  const messages = ref<SupportMessage[]>([]);
  const activeConversation = ref<SupportConversation | null>(null);
  const selectedId = ref<string | null>(null);

  const loadingList = ref(true);
  const loadingMoreList = ref(false);
  const loadingThread = ref(false);
  const loadingHistory = ref(false);
  const loadingOlder = ref(false);
  const sending = ref(false);
  const clearing = ref(false);
  const patching = ref(false);

  const search = ref("");
  const inboxFilter = ref<AdminInboxFilter>("all");
  const inboxSort = ref<AdminInboxSort>("activity");
  const listCursor = ref<string | null>(null);
  const listHasMore = ref(false);

  const nextCursor = ref<string | null>(null);
  const hasMore = ref(false);
  const threadError = ref("");

  let stopThreadPoll: (() => void) | null = null;
  let pollingConversationId: string | null = null;
  let loadInboxInflight: Promise<void> | null = null;
  let loadInboxGeneration = 0;
  const openThreadInflight = new Map<string, Promise<void>>();

  const isArchivedView = computed(() =>
    Boolean(
      activeConversation.value &&
        (!activeConversation.value.isCurrent ||
          activeConversation.value.status === "archived"),
    ),
  );

  const archivedHistory = computed(() =>
    userHistory.value.filter(
      (item) => !item.isCurrent || item.status === "archived",
    ),
  );

  const currentHistoryItem = computed(() =>
    userHistory.value.find(
      (item) => item.isCurrent && item.status !== "archived",
    ),
  );

  function stopPolling() {
    stopThreadPoll?.();
    stopThreadPoll = null;
    pollingConversationId = null;
  }

  async function refreshThreadMessages(conversationId: string) {
    if (pollingConversationId !== conversationId) return;
    try {
      const page = await adminService.listMessages(conversationId, {
        limit: 50,
      });
      if (pollingConversationId !== conversationId) return;
      messages.value = mergeMessages(page.items, messages.value);
      nextCursor.value = page.nextCursor;
      hasMore.value = page.hasMore;
    } catch {
      // Keep showing last loaded messages.
    }
  }

  function startPolling(conversationId: string) {
    if (pollingConversationId === conversationId && stopThreadPoll) return;
    stopPolling();
    pollingConversationId = conversationId;
    stopThreadPoll = startChatPolling(() =>
      refreshThreadMessages(conversationId),
    );
  }

  async function loadInbox(reset = true) {
    const generation = ++loadInboxGeneration;

    if (reset) {
      loadingList.value = true;
      listCursor.value = null;
    } else {
      loadingMoreList.value = true;
    }

    const run = async () => {
      try {
        const filterQuery = inboxFilterToQuery(inboxFilter.value);
        const data = await adminService.listConversations({
          limit: 50,
          cursor: reset ? undefined : listCursor.value || undefined,
          search: search.value.trim() || undefined,
          sort: inboxSort.value,
          ...filterQuery,
        });

        if (generation !== loadInboxGeneration) return;

        conversations.value = reset
          ? data.items
          : [...conversations.value, ...data.items];
        listCursor.value = data.nextCursor;
        listHasMore.value = data.hasMore;
      } catch (err) {
        if (generation !== loadInboxGeneration) return;
        toast.error(
          err instanceof Error ? err.message : "Unable to load inbox",
        );
      } finally {
        if (generation !== loadInboxGeneration) return;
        loadingList.value = false;
        loadingMoreList.value = false;
      }
    };

    loadInboxInflight = run();
    try {
      await loadInboxInflight;
    } finally {
      if (loadInboxInflight === run()) {
        loadInboxInflight = null;
      }
    }
  }

  async function loadUserHistory(userId: string) {
    loadingHistory.value = true;
    try {
      userHistory.value = await adminService.listUserConversations(userId);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unable to load conversation history",
      );
      userHistory.value = [];
    } finally {
      loadingHistory.value = false;
    }
  }

  async function openThread(
    conversationId: string,
    options?: { skipHistoryLoad?: boolean },
  ) {
    if (
      selectedId.value === conversationId &&
      activeConversation.value &&
      !loadingThread.value
    ) {
      startPolling(conversationId);
      return;
    }

    const inflight = openThreadInflight.get(conversationId);
    if (inflight) {
      await inflight;
      return;
    }

    const run = (async () => {
      selectedId.value = conversationId;
      loadingThread.value = true;
      threadError.value = "";
      stopPolling();

      try {
        const [conversation, page] = await Promise.all([
          adminService.getConversation(conversationId),
          adminService.listMessages(conversationId, { limit: 50 }),
        ]);

        activeConversation.value = conversation;
        messages.value = page.items;
        nextCursor.value = page.nextCursor;
        hasMore.value = page.hasMore;

        startPolling(conversationId);

        if (!options?.skipHistoryLoad) {
          void loadUserHistory(conversation.userId);
        }

        const archived =
          !conversation.isCurrent || conversation.status === "archived";
        if (!archived) {
          const updated = await adminService.markRead(conversationId);
          activeConversation.value = updated;
          conversations.value = conversations.value.map((item) =>
            item.id === conversationId
              ? { ...item, unreadCountAdmin: 0 }
              : item,
          );
        }
      } catch (err) {
        threadError.value =
          err instanceof Error ? err.message : "Unable to open conversation";
        activeConversation.value = null;
        toast.error(threadError.value);
      } finally {
        loadingThread.value = false;
      }
    })();

    openThreadInflight.set(conversationId, run);
    try {
      await run;
    } finally {
      openThreadInflight.delete(conversationId);
    }
  }

  async function resolveConversationFromUser(userId: string) {
    loadingHistory.value = true;
    try {
      const list = await adminService.listUserConversations(userId);
      userHistory.value = list;
      const current =
        list.find((c) => c.isCurrent && c.status !== "archived") || list[0];
      if (current) {
        await openThread(current.id, { skipHistoryLoad: true });
        return current.id;
      }
      return null;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to resolve conversation",
      );
      return null;
    } finally {
      loadingHistory.value = false;
    }
  }

  async function loadOlderMessages() {
    if (
      !selectedId.value ||
      !hasMore.value ||
      !nextCursor.value ||
      loadingOlder.value
    )
      return;
    loadingOlder.value = true;
    try {
      const page = await adminService.listMessages(selectedId.value, {
        cursor: nextCursor.value,
        limit: 50,
      });
      const older = page.items;
      messages.value = mergeMessages(
        [...older, ...messages.value.filter((m) => !m.pending)],
        messages.value,
      );
      nextCursor.value = page.nextCursor;
      hasMore.value = page.hasMore;
    } catch (err) {
      threadError.value =
        err instanceof Error ? err.message : "Unable to load older messages";
    } finally {
      loadingOlder.value = false;
    }
  }

  async function sendReply(text: string) {
    if (!selectedId.value || isArchivedView.value) return;
    const trimmed = text.trim();
    if (!trimmed || sending.value) return;

    const tempId = `${OPTIMISTIC_MESSAGE_PREFIX}${crypto.randomUUID()}`;
    const optimistic: SupportMessage = {
      id: tempId,
      conversationId: selectedId.value,
      senderId: "local",
      senderType: "admin",
      text: trimmed,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    messages.value = [
      ...messages.value.filter((m) => m.id !== SYSTEM_GREETING_ID),
      optimistic,
    ];
    sending.value = true;
    threadError.value = "";

    try {
      await adminService.sendMessage(selectedId.value, trimmed);
      messages.value = messages.value.filter((m) => m.id !== tempId);
      await refreshThreadMessages(selectedId.value);
      void loadInbox(true);
    } catch (err) {
      messages.value = messages.value.map((m) =>
        m.id === tempId ? { ...m, pending: false, failed: true } : m,
      );
      threadError.value =
        err instanceof Error ? err.message : "Unable to send reply";
      throw err;
    } finally {
      sending.value = false;
    }
  }

  async function retryFailedMessage(message: SupportMessage) {
    if (!message.failed || !selectedId.value) return;
    messages.value = messages.value.filter((m) => m.id !== message.id);
    await sendReply(message.text);
  }

  async function patchStatus(status: "open" | "pending" | "resolved") {
    if (!selectedId.value || isArchivedView.value || patching.value) return;
    patching.value = true;
    try {
      activeConversation.value = await adminService.patchConversation(
        selectedId.value,
        { status },
      );
      conversations.value = conversations.value.map((item) =>
        item.id === selectedId.value ? { ...item, status } : item,
      );
      void loadInbox(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update status",
      );
    } finally {
      patching.value = false;
    }
  }

  async function patchPriority(priority: "normal" | "high") {
    if (!selectedId.value || isArchivedView.value || patching.value) return;
    patching.value = true;
    try {
      activeConversation.value = await adminService.patchConversation(
        selectedId.value,
        { priority },
      );
      conversations.value = conversations.value.map((item) =>
        item.id === selectedId.value ? { ...item, priority } : item,
      );
      void loadInbox(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to update priority",
      );
    } finally {
      patching.value = false;
    }
  }

  async function clearThread() {
    if (!selectedId.value || isArchivedView.value || clearing.value) return;

    clearing.value = true;
    try {
      stopPolling();
      const previousUserId = activeConversation.value?.userId;
      const next = await adminService.clearConversation(selectedId.value);
      activeConversation.value = next;
      selectedId.value = next.id;
      messages.value = [];
      nextCursor.value = null;
      hasMore.value = false;
      startPolling(next.id);
      if (previousUserId) {
        void loadUserHistory(previousUserId);
      }
      toast.success("Conversation archived, new thread started");
      void loadInbox(true);
      return next.id;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Unable to clear conversation",
      );
      if (selectedId.value) {
        void openThread(selectedId.value);
      }
      throw err;
    } finally {
      clearing.value = false;
    }
  }

  function closeThread() {
    selectedId.value = null;
    activeConversation.value = null;
    userHistory.value = [];
    messages.value = [];
    threadError.value = "";
    stopPolling();
  }

  function dispose() {
    stopPolling();
  }

  return {
    conversations,
    userHistory,
    archivedHistory,
    currentHistoryItem,
    messages,
    activeConversation,
    selectedId,
    loadingList,
    loadingMoreList,
    loadingThread,
    loadingHistory,
    loadingOlder,
    sending,
    clearing,
    patching,
    search,
    inboxFilter,
    inboxSort,
    listHasMore,
    nextCursor,
    hasMore,
    threadError,
    isArchivedView,
    loadInbox,
    loadUserHistory,
    openThread,
    resolveConversationFromUser,
    loadOlderMessages,
    sendReply,
    retryFailedMessage,
    patchStatus,
    patchPriority,
    clearThread,
    closeThread,
    dispose,
  };
}
