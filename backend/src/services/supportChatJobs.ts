import { supportConversationRepository } from "../repositories/firestore/supportConversation.repository";

/** Sends the busy auto-reply when a farmer has waited 5+ minutes without an admin response. */
export async function runSupportAutoReplySweep(): Promise<number> {
  return supportConversationRepository.runAutoReplySweep();
}
