export type SupportConversationStatus =
  | "open"
  | "pending"
  | "resolved"
  | "archived";
export type SupportConversationPriority = "normal" | "high";
export type SupportSenderType = "user" | "admin";

export interface SupportConversationMetadata {
  userAgent?: string;
}

export interface SupportConversationRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  /** Lowercased copy for Firestore prefix search, not for display. */
  userNameLower?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
  lastMessageAt: string;
  lastSenderType: SupportSenderType;
  unreadCountUser: number;
  unreadCountAdmin: number;
  status: SupportConversationStatus;
  priority: SupportConversationPriority;
  /** Denormalized count, maintained server-side on each message. */
  messageCount?: number;
  assignedAdminId?: string;
  lastAdminId?: string;
  /** Exactly one current conversation per user. */
  isCurrent: boolean;
  archivedAt?: string;
  closedAt?: string;
  /** Set on legacy v1 docs after migration to v2 conversation id. */
  migratedToV2?: string;
  migratedAt?: string;
  /** Set on v2 docs migrated from v1 userId-keyed thread. */
  migratedFromV1UserId?: string;
  /** Set when the farmer is waiting for an admin reply (timer for auto-reply). */
  pendingAutoReplyAt?: string;
  /** Prevents duplicate busy auto-replies for the same user wait window. */
  autoReplySent?: boolean;
  metadata?: SupportConversationMetadata;
}

export interface SupportMessageRecord {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SupportSenderType;
  text: string;
  createdAt: string;
  readByUserAt?: string;
  readByAdminAt?: string;
  attachmentUrl?: string;
  attachmentType?: string;
  internalNote?: boolean;
}

export interface AddSupportMessageInput {
  text: string;
  senderId: string;
  senderType: SupportSenderType;
}

export const SUPPORT_GREETING =
  "👋 Hi! Welcome to Farmingo Support.\n\nHow can we help you today? Ask us about your farm, crops, disease assessments, tasks, weather, or anything on the platform.";

export const SUPPORT_BUSY_AUTO_REPLY =
  "Thanks for reaching out! Our team is helping other farmers right now. We'll connect with you as soon as possible, usually within a few hours during business hours. Your message is in our queue.";

/** Stable Firestore doc id, must not use reserved `__...__` prefix. */
export const SYSTEM_GREETING_MESSAGE_ID = "farmingo-system-greeting";
export const SYSTEM_AUTO_REPLY_MESSAGE_ID = "farmingo-system-auto-reply";
export const SYSTEM_SENDER_ID = "farmingo-support";
