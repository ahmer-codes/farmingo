import type {
  SupportConversation,
  SupportConversationView,
  SupportMessage,
  SupportMessagePage,
} from "~/types/support";
import { apiRequest } from "./apiClient";

export const supportChatService = {
  getCurrentConversation() {
    return apiRequest<SupportConversationView>(
      "/support/conversations/current",
    );
  },

  listMessages(
    conversationId: string,
    query?: { cursor?: string; limit?: number },
  ) {
    return apiRequest<SupportMessagePage>(
      `/support/conversations/${conversationId}/messages`,
      {
        query,
      },
    );
  },

  sendMessage(conversationId: string, text: string) {
    return apiRequest<SupportMessage>(
      `/support/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: { text },
      },
    );
  },

  markRead(conversationId: string) {
    return apiRequest<SupportConversation>(
      `/support/conversations/${conversationId}/read`,
      {
        method: "POST",
      },
    );
  },

  clearConversation(conversationId: string) {
    return apiRequest<SupportConversation>(
      `/support/conversations/${conversationId}/clear`,
      {
        method: "POST",
      },
    );
  },

  unreadCount() {
    return apiRequest<{ unreadCount: number }>(
      "/support/conversations/current/unread-count",
    );
  },
};
