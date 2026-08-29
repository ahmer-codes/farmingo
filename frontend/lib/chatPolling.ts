/** Poll open chat threads via REST, no client Firestore listeners. */
export const CHAT_POLL_INTERVAL_MS = 5000;

export function startChatPolling(
  tick: () => void | Promise<void>,
  intervalMs = CHAT_POLL_INTERVAL_MS,
): () => void {
  void tick();
  const timer = setInterval(() => void tick(), intervalMs);
  return () => clearInterval(timer);
}
