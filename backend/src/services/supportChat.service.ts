import { db, adminAuth } from "../config/firebase-admin";
import { userRepository } from "../repositories";
import { supportConversationRepository } from "../repositories/firestore/supportConversation.repository";
import type {
  SupportConversationPriority,
  SupportConversationRecord,
  SupportConversationStatus,
  SupportMessageRecord,
} from "../models/supportConversation";
import {
  SUPPORT_GREETING,
  SYSTEM_GREETING_MESSAGE_ID,
} from "../models/supportConversation";
import { ApiError } from "../utils/ApiError";
import { COLLECTIONS, nowIso, stripUndefined } from "../utils/firestore";

export interface SupportConversationView {
  conversation: SupportConversationRecord;
  greeting: string;
  hasMessages: boolean;
}

export interface MessagePage {
  items: SupportMessageRecord[];
  greeting: string;
  nextCursor: string | null;
  hasMore: boolean;
}

async function resolveUserProfile(userId: string) {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(404, "User profile not found");
  return user;
}

async function ensureCurrentConversation(
  userId: string,
  metadata?: { userAgent?: string },
): Promise<SupportConversationRecord> {
  let conversation =
    await supportConversationRepository.getCurrentConversation(userId);
  const user = await resolveUserProfile(userId);

  if (conversation) {
    const synced = await supportConversationRepository.syncUserProfileOnCurrent(
      userId,
      user.email,
      user.fullName,
    );
    return synced || conversation;
  }

  return supportConversationRepository.createConversation({
    userId,
    userEmail: user.email,
    userName: user.fullName,
    metadata,
    isCurrent: true,
  });
}

async function requireConversationForUser(
  conversationId: string,
  userId: string,
) {
  const conversation =
    await supportConversationRepository.getById(conversationId);
  if (!conversation || conversation.userId !== userId) {
    throw new ApiError(404, "Conversation not found");
  }
  return conversation;
}

async function requireConversation(conversationId: string) {
  const conversation =
    await supportConversationRepository.getById(conversationId);
  if (!conversation) throw new ApiError(404, "Conversation not found");
  return conversation;
}

function withGreeting(
  messages: SupportMessageRecord[],
): SupportMessageRecord[] {
  if (messages.length > 0) return messages;
  return [
    {
      id: SYSTEM_GREETING_MESSAGE_ID,
      conversationId: "",
      senderId: "system",
      senderType: "admin",
      text: SUPPORT_GREETING,
      createdAt: new Date(0).toISOString(),
    },
  ];
}

function validateMessageText(text: string) {
  const trimmed = text.trim();
  if (!trimmed) throw new ApiError(422, "Message cannot be empty");
  if (trimmed.length > 4000) throw new ApiError(422, "Message is too long");
  return trimmed;
}

function assertConversationWritable(conversation: SupportConversationRecord) {
  if (!conversation.isCurrent || conversation.status === "archived") {
    throw new ApiError(400, "Cannot send messages to an archived conversation");
  }
}

async function assertValidAdminAssignee(adminId: string) {
  try {
    const authUser = await adminAuth.getUser(adminId);
    const claims = authUser.customClaims || {};
    if (claims.role !== "admin") {
      throw new ApiError(
        422,
        "assignedAdminId must reference an admin account",
      );
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      422,
      "assignedAdminId must reference a valid admin account",
    );
  }
}

export const supportChatService = {
  async getCurrentConversation(
    userId: string,
    metadata?: { userAgent?: string },
  ): Promise<SupportConversationView> {
    const conversation = await ensureCurrentConversation(userId, metadata);
    await supportConversationRepository.ensureWelcomeMessage(conversation.id);
    const page = await supportConversationRepository.listMessages(
      conversation.id,
      { limit: 1 },
    );
    return {
      conversation,
      greeting: SUPPORT_GREETING,
      hasMessages: page.items.length > 0,
    };
  },

  async listMessages(
    userId: string,
    conversationId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MessagePage> {
    await requireConversationForUser(conversationId, userId);
    const page = await supportConversationRepository.listMessages(
      conversationId,
      { cursor, limit },
    );
    return {
      items: withGreeting(page.items),
      greeting: SUPPORT_GREETING,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  async sendUserMessage(
    userId: string,
    conversationId: string,
    text: string,
  ): Promise<SupportMessageRecord> {
    const trimmed = validateMessageText(text);
    const conversation = await requireConversationForUser(
      conversationId,
      userId,
    );
    assertConversationWritable(conversation);
    const { message } = await supportConversationRepository.addMessage(
      conversationId,
      {
        text: trimmed,
        senderId: userId,
        senderType: "user",
      },
    );
    return message;
  },

  async markUserRead(userId: string, conversationId: string) {
    await requireConversationForUser(conversationId, userId);
    return supportConversationRepository.markUserRead(conversationId);
  },

  async clearConversation(userId: string, conversationId: string) {
    const conversation = await requireConversationForUser(
      conversationId,
      userId,
    );
    if (!conversation.isCurrent) {
      const current =
        await supportConversationRepository.getCurrentConversation(userId);
      if (current) return current;
      throw new ApiError(400, "Only the current conversation can be cleared");
    }
    return supportConversationRepository.archiveAndStartNewCurrent(
      conversationId,
    );
  },

  async getUnreadCount(userId: string): Promise<number> {
    const conversation =
      await supportConversationRepository.getCurrentConversation(userId);
    return conversation?.unreadCountUser ?? 0;
  },
};

export const adminSupportChatService = {
  async listConversations(options: {
    limit?: number;
    cursor?: string;
    status?: SupportConversationStatus;
    priority?: SupportConversationPriority;
    unreadOnly?: boolean;
    search?: string;
    sort?: "activity" | "unread" | "priority";
  }) {
    return supportConversationRepository.listConversations({
      ...options,
      includeArchived: false,
    });
  },

  async listUserConversations(userId: string) {
    const conversations = await supportConversationRepository.listByUserId(
      userId,
      50,
    );
    return conversations.map((c) => ({
      ...c,
      messageCount: c.messageCount ?? 0,
    }));
  },

  async getConversation(conversationId: string) {
    return requireConversation(conversationId);
  },

  async listMessages(
    conversationId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MessagePage> {
    const conversation = await requireConversation(conversationId);
    if (conversation.isCurrent) {
      await supportConversationRepository.ensureWelcomeMessage(conversationId);
    }
    const page = await supportConversationRepository.listMessages(
      conversationId,
      { cursor, limit },
    );
    const items = conversation.isCurrent
      ? withGreeting(page.items)
      : page.items;
    return {
      items,
      greeting: SUPPORT_GREETING,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  },

  async sendAdminMessage(
    adminId: string,
    conversationId: string,
    text: string,
  ): Promise<SupportMessageRecord> {
    const trimmed = validateMessageText(text);
    const conversation = await requireConversation(conversationId);
    assertConversationWritable(conversation);
    const { message } = await supportConversationRepository.addMessage(
      conversationId,
      {
        text: trimmed,
        senderId: adminId,
        senderType: "admin",
      },
    );

    if (!conversation.assignedAdminId) {
      await supportConversationRepository.updateConversation(conversationId, {
        assignedAdminId: adminId,
      });
    }

    await logAdminAction(
      adminId,
      "chat_reply",
      conversation.userId,
      conversationId,
    );
    return message;
  },

  async markAdminRead(adminId: string, conversationId: string) {
    const conversation = await requireConversation(conversationId);
    const result =
      await supportConversationRepository.markAdminRead(conversationId);
    if (!result) throw new ApiError(404, "Conversation not found");
    await logAdminAction(
      adminId,
      "chat_mark_read",
      conversation.userId,
      conversationId,
    );
    return result;
  },

  async clearConversation(adminId: string, conversationId: string) {
    const conversation = await requireConversation(conversationId);
    if (!conversation.isCurrent) {
      const current =
        await supportConversationRepository.getCurrentConversation(
          conversation.userId,
        );
      if (current) return current;
      throw new ApiError(400, "Only the current conversation can be cleared");
    }
    const next =
      await supportConversationRepository.archiveAndStartNewCurrent(
        conversationId,
      );
    await logAdminAction(
      adminId,
      "chat_clear",
      conversation.userId,
      conversationId,
    );
    return next;
  },

  async updateConversation(
    adminId: string,
    conversationId: string,
    patch: {
      status?: SupportConversationStatus;
      priority?: SupportConversationPriority;
      assignedAdminId?: string;
    },
  ) {
    const existing = await requireConversation(conversationId);
    if (!existing.isCurrent || existing.status === "archived") {
      throw new ApiError(400, "Archived conversations cannot be modified");
    }
    if (patch.status === "archived") {
      throw new ApiError(400, "Use clear conversation to archive a thread");
    }

    const nextAssignedAdminId =
      patch.assignedAdminId ??
      (patch.status && !existing.assignedAdminId
        ? adminId
        : existing.assignedAdminId);

    if (patch.assignedAdminId) {
      await assertValidAdminAssignee(patch.assignedAdminId);
    } else if (
      nextAssignedAdminId &&
      nextAssignedAdminId !== existing.assignedAdminId
    ) {
      await assertValidAdminAssignee(nextAssignedAdminId);
    }

    const updated = await supportConversationRepository.updateConversation(
      conversationId,
      {
        ...patch,
        assignedAdminId: nextAssignedAdminId,
        ...(patch.status === "resolved" ? { closedAt: nowIso() } : {}),
      },
    );
    if (!updated) throw new ApiError(404, "Conversation not found");

    if (patch.status)
      await logAdminAction(
        adminId,
        `chat_status_${patch.status}`,
        existing.userId,
        conversationId,
      );
    if (patch.priority)
      await logAdminAction(
        adminId,
        `chat_priority_${patch.priority}`,
        existing.userId,
        conversationId,
      );
    return updated;
  },

  async getUnreadStats() {
    const [unreadConversations, openConversations] = await Promise.all([
      supportConversationRepository.countUnreadAdmin(),
      supportConversationRepository.countOpen(),
    ]);
    return { unreadConversations, openConversations };
  },
};

async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string,
  conversationId?: string,
) {
  await db.collection(COLLECTIONS.adminAuditLogs).add(
    stripUndefined({
      adminId,
      action,
      targetUserId,
      conversationId,
      createdAt: nowIso(),
    }),
  );
}

export { logAdminAction };
