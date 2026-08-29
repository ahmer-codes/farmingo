export type SupportConversationStatus =
  | "open"
  | "pending"
  | "resolved"
  | "archived";
export type SupportConversationPriority = "normal" | "high";
export type SupportSenderType = "user" | "admin";

export interface SupportConversation {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
  lastMessageText: string;
  lastMessageAt: string;
  lastSenderType: SupportSenderType;
  unreadCountUser: number;
  unreadCountAdmin: number;
  status: SupportConversationStatus;
  priority: SupportConversationPriority;
  assignedAdminId?: string;
  lastAdminId?: string;
  isCurrent: boolean;
  archivedAt?: string;
  closedAt?: string;
  messageCount?: number;
}

export interface SupportMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: SupportSenderType;
  text: string;
  createdAt: string;
  readByUserAt?: string;
  readByAdminAt?: string;
  /** Optimistic UI, not persisted. */
  pending?: boolean;
  failed?: boolean;
}

export interface SupportConversationView {
  conversation: SupportConversation;
  greeting: string;
  hasMessages: boolean;
}

export interface SupportMessagePage {
  items: SupportMessage[];
  greeting: string;
  nextCursor: string | null;
  hasMore: boolean;
}
