import { randomUUID } from "crypto";
import { FieldValue } from "firebase-admin/firestore";
import { db } from "../../config/firebase-admin";
import type {
  AddSupportMessageInput,
  SupportConversationPriority,
  SupportConversationRecord,
  SupportConversationStatus,
  SupportMessageRecord,
  SupportSenderType,
} from "../../models/supportConversation";
import {
  SUPPORT_BUSY_AUTO_REPLY,
  SUPPORT_GREETING,
  SYSTEM_AUTO_REPLY_MESSAGE_ID,
  SYSTEM_GREETING_MESSAGE_ID,
  SYSTEM_SENDER_ID,
} from "../../models/supportConversation";
import {
  COLLECTIONS,
  docToRecord,
  nowIso,
  stripUndefined,
} from "../../utils/firestore";

const conversationsCol = () => db.collection(COLLECTIONS.supportConversations);
const messagesCol = (conversationId: string) =>
  conversationsCol().doc(conversationId).collection("messages");

const INBOX_FETCH_CAP = 500;
const AUTO_REPLY_WAIT_MS = 5 * 60 * 1000;

export type ConversationListSort = "activity" | "unread" | "priority";

export interface ListConversationsOptions {
  limit?: number;
  cursor?: string;
  status?: SupportConversationStatus;
  priority?: SupportConversationPriority;
  unreadOnly?: boolean;
  search?: string;
  userId?: string;
  includeArchived?: boolean;
  sort?: ConversationListSort;
}

export interface ListMessagesOptions {
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

function conversationRef(conversationId: string) {
  return conversationsCol().doc(conversationId);
}

function sortConversationItems(
  items: SupportConversationRecord[],
  sort: ConversationListSort = "activity",
): SupportConversationRecord[] {
  if (sort === "activity") return items;

  return [...items].sort((a, b) => {
    if (sort === "unread") {
      const unreadDiff =
        Number(b.unreadCountAdmin > 0) - Number(a.unreadCountAdmin > 0);
      if (unreadDiff !== 0) return unreadDiff;
    }
    if (sort === "priority") {
      const priorityDiff =
        Number(b.priority === "high") - Number(a.priority === "high");
      if (priorityDiff !== 0) return priorityDiff;
    }
    return (
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  });
}

async function stampReadReceipts(
  _conversationId: string,
  _senderType: SupportSenderType,
  _field: "readByUserAt" | "readByAdminAt",
  _now: string,
) {
  // Simple text chat: unread badges only, no per-message read-receipt queries
  // (avoids composite Firestore indexes on messages subcollections).
}

function matchesConversationFilters(
  conversation: SupportConversationRecord,
  options: ListConversationsOptions,
): boolean {
  if (!options.includeArchived && !conversation.isCurrent) return false;
  if (options.userId && conversation.userId !== options.userId) return false;
  if (options.status && conversation.status !== options.status) return false;
  if (options.priority && conversation.priority !== options.priority)
    return false;
  if (options.unreadOnly && conversation.unreadCountAdmin <= 0) return false;
  return true;
}

function matchesConversationSearch(
  conversation: SupportConversationRecord,
  raw: string,
): boolean {
  const q = raw.trim().toLowerCase();
  if (!q) return true;
  return (
    conversation.userEmail.toLowerCase().includes(q) ||
    conversation.userName.toLowerCase().includes(q) ||
    (conversation.userNameLower || "").includes(q) ||
    conversation.userId.toLowerCase().includes(q) ||
    conversation.id.toLowerCase().includes(q)
  );
}

function paginateConversationList(
  items: SupportConversationRecord[],
  sort: ConversationListSort,
  limit: number,
  cursor?: string,
): PaginatedResult<SupportConversationRecord> {
  const sorted = sortConversationItems(items, sort);
  let start = 0;
  if (cursor) {
    const cursorIndex = sorted.findIndex((item) => item.id === cursor);
    start = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }
  const slice = sorted.slice(start, start + limit + 1);
  const hasMore = slice.length > limit;
  const page = hasMore ? slice.slice(0, limit) : slice;
  return {
    items: page,
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    hasMore,
  };
}

async function fetchInboxConversations(
  options: ListConversationsOptions,
): Promise<SupportConversationRecord[]> {
  const qs = await conversationsCol()
    .where("isCurrent", "==", true)
    .limit(INBOX_FETCH_CAP)
    .get();

  return qs.docs
    .map((d) => docToRecord<SupportConversationRecord>(d))
    .filter((conversation) =>
      matchesConversationFilters(conversation, options),
    );
}

async function ensureLegacyConversation(
  userId: string,
): Promise<SupportConversationRecord | null> {
  const v1Ref = conversationRef(userId);
  const v1Snap = await v1Ref.get();
  if (!v1Snap.exists) return null;

  const data = v1Snap.data();
  if (!data || data.migratedToV2 || data.userId !== userId) return null;

  const userName = String(data.userName || "Farmer");
  const now = nowIso();
  await v1Ref.update(
    stripUndefined({
      isCurrent: true,
      status: data.status || "open",
      userNameLower: userName.trim().toLowerCase(),
      updatedAt: now,
    }),
  );

  const upgraded = await v1Ref.get();
  return docToRecord<SupportConversationRecord>(upgraded);
}

async function seedWelcomeMessage(conversationId: string) {
  const msgRef = messagesCol(conversationId).doc(SYSTEM_GREETING_MESSAGE_ID);
  const existing = await msgRef.get();
  if (existing.exists) return;

  const now = nowIso();
  await msgRef.set(
    stripUndefined({
      conversationId,
      senderId: SYSTEM_SENDER_ID,
      senderType: "admin",
      text: SUPPORT_GREETING,
      createdAt: now,
    }),
  );
}

async function searchConversations(
  options: ListConversationsOptions,
  limit: number,
): Promise<PaginatedResult<SupportConversationRecord>> {
  const raw = options.search?.trim() || "";
  const sort = options.sort ?? "activity";

  try {
    const q = raw.toLowerCase();
    if (/^[a-z0-9]{20,}$/i.test(q)) {
      const snap = await conversationsCol()
        .where("userId", "==", q)
        .where("isCurrent", "==", true)
        .limit(1)
        .get();
      const items = snap.docs.map((d) =>
        docToRecord<SupportConversationRecord>(d),
      );
      return paginateConversationList(
        items.filter((c) => matchesConversationFilters(c, options)),
        sort,
        limit,
        options.cursor,
      );
    }

    if (q) {
      const field = q.includes("@") ? "userEmail" : "userNameLower";
      const qs = await conversationsCol()
        .where("isCurrent", "==", true)
        .where(field, ">=", q)
        .where(field, "<=", q + "\uf8ff")
        .orderBy(field)
        .limit(Math.min((limit + 1) * 4, 200))
        .get();

      let items = qs.docs.map((d) => docToRecord<SupportConversationRecord>(d));
      items = items.filter((c) => matchesConversationFilters(c, options));
      return paginateConversationList(items, sort, limit, options.cursor);
    }
  } catch {
    // Fall through to in-memory search when composite indexes are not deployed yet.
  }

  const all = await fetchInboxConversations(options);
  const filtered = all.filter((c) => matchesConversationSearch(c, raw));
  return paginateConversationList(filtered, sort, limit, options.cursor);
}

function buildConversationRecord(
  id: string,
  input: {
    userId: string;
    userEmail: string;
    userName: string;
    metadata?: SupportConversationRecord["metadata"];
    isCurrent?: boolean;
    migratedFromV1UserId?: string;
    status?: SupportConversationStatus;
    priority?: SupportConversationPriority;
    unreadCountUser?: number;
    unreadCountAdmin?: number;
    lastMessageText?: string;
    lastMessageAt?: string;
    lastSenderType?: SupportSenderType;
    createdAt?: string;
    updatedAt?: string;
  },
): SupportConversationRecord {
  const now = input.updatedAt || input.createdAt || nowIso();
  return {
    id,
    userId: input.userId,
    userEmail: input.userEmail.toLowerCase().trim(),
    userName: input.userName.trim(),
    userNameLower: input.userName.trim().toLowerCase(),
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    lastMessageText: input.lastMessageText ?? "",
    lastMessageAt: input.lastMessageAt || now,
    lastSenderType: input.lastSenderType || "user",
    unreadCountUser: input.unreadCountUser ?? 0,
    unreadCountAdmin: input.unreadCountAdmin ?? 0,
    status: input.status ?? "open",
    priority: input.priority ?? "normal",
    isCurrent: input.isCurrent ?? true,
    migratedFromV1UserId: input.migratedFromV1UserId,
    metadata: input.metadata,
  };
}

export const supportConversationRepository = {
  async ensureWelcomeMessage(conversationId: string) {
    await seedWelcomeMessage(conversationId);
  },

  async getById(
    conversationId: string,
  ): Promise<SupportConversationRecord | null> {
    const snap = await conversationRef(conversationId).get();
    if (!snap.exists) return null;
    return docToRecord<SupportConversationRecord>(snap);
  },

  /** @deprecated v1 compat, resolves current conversation for a user. */
  async getConversation(
    userId: string,
  ): Promise<SupportConversationRecord | null> {
    return this.getCurrentConversation(userId);
  },

  async getCurrentConversation(
    userId: string,
  ): Promise<SupportConversationRecord | null> {
    const qs = await conversationsCol()
      .where("userId", "==", userId)
      .limit(25)
      .get();
    const current = qs.docs
      .map((d) => docToRecord<SupportConversationRecord>(d))
      .find((c) => c.isCurrent && c.status !== "archived");
    if (current) return current;
    return ensureLegacyConversation(userId);
  },

  async listByUserId(
    userId: string,
    limit = 50,
  ): Promise<SupportConversationRecord[]> {
    const qs = await conversationsCol()
      .where("userId", "==", userId)
      .limit(100)
      .get();
    return qs.docs
      .map((d) => docToRecord<SupportConversationRecord>(d))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, Math.min(Math.max(limit, 1), 100));
  },

  async createConversation(input: {
    userId: string;
    userEmail: string;
    userName: string;
    metadata?: SupportConversationRecord["metadata"];
    isCurrent?: boolean;
    migratedFromV1UserId?: string;
    status?: SupportConversationStatus;
    priority?: SupportConversationPriority;
    unreadCountUser?: number;
    unreadCountAdmin?: number;
    lastMessageText?: string;
    lastMessageAt?: string;
    lastSenderType?: SupportSenderType;
    createdAt?: string;
    updatedAt?: string;
    conversationId?: string;
  }): Promise<SupportConversationRecord> {
    const conversationId = input.conversationId || randomUUID();
    const isCurrent = input.isCurrent ?? true;

    if (isCurrent) {
      const record = await db.runTransaction(async (tx) => {
        const currentQuery = conversationsCol()
          .where("userId", "==", input.userId)
          .where("isCurrent", "==", true)
          .limit(1);
        const existingCurrent = await tx.get(currentQuery);

        for (const doc of existingCurrent.docs) {
          tx.update(doc.ref, { isCurrent: false, updatedAt: nowIso() });
        }

        const built = buildConversationRecord(conversationId, input);
        const { id, ...rest } = built;
        tx.set(conversationRef(conversationId), stripUndefined(rest));
        return built;
      });
      await seedWelcomeMessage(record.id);
      return record;
    }

    const record = buildConversationRecord(conversationId, input);
    const { id, ...rest } = record;
    await conversationRef(conversationId).set(stripUndefined(rest));
    return record;
  },

  async updateConversation(
    conversationId: string,
    patch: Partial<
      Pick<
        SupportConversationRecord,
        | "userEmail"
        | "userName"
        | "userNameLower"
        | "lastMessageText"
        | "lastMessageAt"
        | "lastSenderType"
        | "unreadCountUser"
        | "unreadCountAdmin"
        | "status"
        | "priority"
        | "assignedAdminId"
        | "lastAdminId"
        | "isCurrent"
        | "archivedAt"
        | "closedAt"
        | "migratedToV2"
        | "migratedAt"
        | "pendingAutoReplyAt"
        | "autoReplySent"
      >
    >,
  ): Promise<SupportConversationRecord | null> {
    const ref = conversationRef(conversationId);
    const existing = await ref.get();
    if (!existing.exists) return null;
    await ref.update(
      stripUndefined({
        ...patch,
        updatedAt: nowIso(),
      }),
    );
    const updated = await ref.get();
    return docToRecord<SupportConversationRecord>(updated);
  },

  async syncUserProfileOnCurrent(
    userId: string,
    userEmail: string,
    userName: string,
  ) {
    const current = await this.getCurrentConversation(userId);
    if (!current) return null;
    if (
      current.userEmail === userEmail.toLowerCase() &&
      current.userName === userName.trim()
    ) {
      return current;
    }
    return this.updateConversation(current.id, {
      userEmail: userEmail.toLowerCase(),
      userName: userName.trim(),
      userNameLower: userName.trim().toLowerCase(),
    });
  },

  async addMessage(
    conversationId: string,
    input: AddSupportMessageInput,
  ): Promise<{
    message: SupportMessageRecord;
    conversation: SupportConversationRecord;
  }> {
    const ref = conversationRef(conversationId);
    const messageId = randomUUID();
    const now = nowIso();

    const result = await db.runTransaction(async (tx) => {
      const convSnap = await tx.get(ref);
      if (!convSnap.exists) {
        throw new Error("Conversation not found");
      }
      const conversation = docToRecord<SupportConversationRecord>(convSnap);

      if (!conversation.isCurrent || conversation.status === "archived") {
        throw new Error("Cannot send messages to an archived conversation");
      }

      const message: SupportMessageRecord = {
        id: messageId,
        conversationId,
        senderId: input.senderId,
        senderType: input.senderType,
        text: input.text.trim(),
        createdAt: now,
      };

      const msgRef = messagesCol(conversationId).doc(messageId);
      const { id: _id, ...msgRest } = message;
      tx.set(msgRef, stripUndefined(msgRest));

      const unreadCountUser =
        input.senderType === "admin"
          ? conversation.unreadCountUser + 1
          : conversation.unreadCountUser;
      const unreadCountAdmin =
        input.senderType === "user"
          ? conversation.unreadCountAdmin + 1
          : conversation.unreadCountAdmin;

      const patch: Record<string, unknown> = {
        lastMessageText: message.text.slice(0, 500),
        lastMessageAt: now,
        lastSenderType: input.senderType as SupportSenderType,
        unreadCountUser,
        unreadCountAdmin,
        messageCount: (conversation.messageCount ?? 0) + 1,
        updatedAt: now,
        ...(input.senderType === "admin"
          ? { lastAdminId: input.senderId }
          : {}),
        ...(conversation.status === "resolved"
          ? { status: "open" as const }
          : {}),
      };

      if (input.senderType === "user") {
        patch.pendingAutoReplyAt = now;
        patch.autoReplySent = false;
      } else {
        patch.pendingAutoReplyAt = FieldValue.delete();
        patch.autoReplySent = false;
      }

      tx.update(ref, stripUndefined(patch));

      return {
        message,
        conversation: {
          ...conversation,
          ...patch,
          id: conversation.id,
          pendingAutoReplyAt: input.senderType === "user" ? now : undefined,
        } as SupportConversationRecord,
      };
    });

    return result;
  },

  async listMessages(
    conversationId: string,
    options: ListMessagesOptions = {},
  ): Promise<PaginatedResult<SupportMessageRecord>> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    let query = messagesCol(conversationId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1);

    if (options.cursor) {
      const cursorSnap = await messagesCol(conversationId)
        .doc(options.cursor)
        .get();
      if (cursorSnap.exists) {
        query = messagesCol(conversationId)
          .orderBy("createdAt", "desc")
          .startAfter(cursorSnap)
          .limit(limit + 1);
      }
    }

    const qs = await query.get();
    const docs = qs.docs.map((d) => docToRecord<SupportMessageRecord>(d));
    const hasMore = docs.length > limit;
    const items = (hasMore ? docs.slice(0, limit) : docs).reverse();
    const nextCursor = hasMore ? (items[0]?.id ?? null) : null;

    return { items, nextCursor, hasMore };
  },

  async listConversations(
    options: ListConversationsOptions = {},
  ): Promise<PaginatedResult<SupportConversationRecord>> {
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const sort = options.sort ?? "activity";

    if (options.search?.trim()) {
      return searchConversations(options, limit);
    }

    const items = await fetchInboxConversations(options);
    return paginateConversationList(items, sort, limit, options.cursor);
  },

  async markUserRead(
    conversationId: string,
  ): Promise<SupportConversationRecord | null> {
    const ref = conversationRef(conversationId);
    const now = nowIso();
    const existing = await ref.get();
    if (!existing.exists) return null;

    await ref.update({ unreadCountUser: 0, updatedAt: now });
    await stampReadReceipts(conversationId, "admin", "readByUserAt", now);

    const updated = await ref.get();
    return docToRecord<SupportConversationRecord>(updated);
  },

  async markAdminRead(
    conversationId: string,
  ): Promise<SupportConversationRecord | null> {
    const ref = conversationRef(conversationId);
    const now = nowIso();
    const existing = await ref.get();
    if (!existing.exists) return null;

    await ref.update({ unreadCountAdmin: 0, updatedAt: now });
    await stampReadReceipts(conversationId, "user", "readByAdminAt", now);

    const updated = await ref.get();
    return docToRecord<SupportConversationRecord>(updated);
  },

  async countMessages(conversationId: string): Promise<number> {
    const qs = await messagesCol(conversationId).count().get();
    return qs.data().count;
  },

  /**
   * Archives the current conversation and atomically creates a new empty current thread.
   * Idempotent when the target is already archived (returns the user's current conversation).
   */
  async archiveAndStartNewCurrent(
    conversationId: string,
  ): Promise<SupportConversationRecord> {
    const newConversationId = randomUUID();
    const now = nowIso();

    const record = await db.runTransaction(async (tx) => {
      const targetRef = conversationRef(conversationId);
      const targetSnap = await tx.get(targetRef);
      if (!targetSnap.exists) {
        throw new Error("Conversation not found");
      }
      const existing = docToRecord<SupportConversationRecord>(targetSnap);

      if (!existing.isCurrent) {
        const currentQuery = conversationsCol()
          .where("userId", "==", existing.userId)
          .where("isCurrent", "==", true)
          .limit(1);
        const currentSnap = await tx.get(currentQuery);
        if (!currentSnap.empty) {
          return docToRecord<SupportConversationRecord>(currentSnap.docs[0]!);
        }

        const built = buildConversationRecord(newConversationId, {
          userId: existing.userId,
          userEmail: existing.userEmail,
          userName: existing.userName,
          metadata: existing.metadata,
          isCurrent: true,
        });
        const { id, ...rest } = built;
        tx.set(conversationRef(newConversationId), stripUndefined(rest));
        return built;
      }

      tx.update(
        targetRef,
        stripUndefined({
          isCurrent: false,
          archivedAt: now,
          closedAt: now,
          status: "archived",
          unreadCountUser: 0,
          unreadCountAdmin: 0,
          updatedAt: now,
        }),
      );

      const othersQuery = conversationsCol()
        .where("userId", "==", existing.userId)
        .where("isCurrent", "==", true);
      const othersSnap = await tx.get(othersQuery);
      for (const doc of othersSnap.docs) {
        if (doc.id !== conversationId) {
          tx.update(
            doc.ref,
            stripUndefined({
              isCurrent: false,
              archivedAt: now,
              closedAt: now,
              status: "archived",
              unreadCountUser: 0,
              unreadCountAdmin: 0,
              updatedAt: now,
            }),
          );
        }
      }

      const built = buildConversationRecord(newConversationId, {
        userId: existing.userId,
        userEmail: existing.userEmail,
        userName: existing.userName,
        metadata: existing.metadata,
        isCurrent: true,
        status: "open",
      });
      const { id, ...rest } = built;
      tx.set(conversationRef(newConversationId), stripUndefined(rest));
      return built;
    });

    await seedWelcomeMessage(record.id);
    return record;
  },

  async countUnreadAdmin(): Promise<number> {
    const qs = await conversationsCol()
      .where("isCurrent", "==", true)
      .limit(INBOX_FETCH_CAP)
      .get();
    return qs.docs.filter((doc) => (doc.data().unreadCountAdmin ?? 0) > 0)
      .length;
  },

  async countOpen(): Promise<number> {
    const qs = await conversationsCol()
      .where("isCurrent", "==", true)
      .limit(INBOX_FETCH_CAP)
      .get();
    return qs.docs.filter((doc) => doc.data().status === "open").length;
  },

  async runAutoReplySweep(): Promise<number> {
    const threshold = Date.now() - AUTO_REPLY_WAIT_MS;
    const qs = await conversationsCol()
      .where("isCurrent", "==", true)
      .limit(INBOX_FETCH_CAP)
      .get();
    let sent = 0;

    for (const doc of qs.docs) {
      const conversation = docToRecord<SupportConversationRecord>(doc);
      if (conversation.status === "archived" || !conversation.isCurrent)
        continue;
      if (conversation.autoReplySent) continue;
      if (conversation.lastSenderType !== "user") continue;
      if (!conversation.pendingAutoReplyAt) continue;

      const pendingAt = new Date(conversation.pendingAutoReplyAt).getTime();
      if (Number.isNaN(pendingAt) || pendingAt > threshold) continue;

      const autoRef = messagesCol(conversation.id).doc(
        SYSTEM_AUTO_REPLY_MESSAGE_ID,
      );
      const autoExisting = await autoRef.get();
      if (autoExisting.exists) {
        await conversationRef(conversation.id).update({
          autoReplySent: true,
          updatedAt: nowIso(),
        });
        continue;
      }

      const now = nowIso();
      await autoRef.set(
        stripUndefined({
          conversationId: conversation.id,
          senderId: SYSTEM_SENDER_ID,
          senderType: "admin",
          text: SUPPORT_BUSY_AUTO_REPLY,
          createdAt: now,
        }),
      );

      await conversationRef(conversation.id).update(
        stripUndefined({
          lastMessageText: SUPPORT_BUSY_AUTO_REPLY.slice(0, 500),
          lastMessageAt: now,
          lastSenderType: "admin",
          unreadCountUser: conversation.unreadCountUser + 1,
          autoReplySent: true,
          pendingAutoReplyAt: FieldValue.delete(),
          updatedAt: now,
        }),
      );
      sent += 1;
    }

    return sent;
  },

  /** Copy messages from v1 userId-keyed thread into v2 conversation (migration helper). */
  async copyMessagesFromV1(
    v1UserId: string,
    targetConversationId: string,
  ): Promise<number> {
    const sourceMessages = await messagesCol(v1UserId)
      .orderBy("createdAt", "asc")
      .get();
    if (sourceMessages.empty) return 0;

    let batch = db.batch();
    let ops = 0;
    let copied = 0;

    for (const doc of sourceMessages.docs) {
      const data = doc.data();
      const targetRef = messagesCol(targetConversationId).doc(doc.id);
      batch.set(
        targetRef,
        stripUndefined({
          ...data,
          conversationId: targetConversationId,
        }),
      );
      ops += 1;
      copied += 1;
      if (ops >= 400) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }
    if (ops > 0) await batch.commit();
    return copied;
  },
};
