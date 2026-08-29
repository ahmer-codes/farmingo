import { authService } from "~/services/auth.service";

const SESSION_KEY = "farmingo-session-started";
const HEARTBEAT_MS = 5 * 60 * 1000;

export default defineNuxtPlugin(() => {
  if (!import.meta.client) return;

  const auth = useAuthStore();
  const route = useRoute();
  let timer: ReturnType<typeof setInterval> | null = null;

  async function recordSessionStartOnce() {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    try {
      await authService.sessionStart();
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Non-blocking, session tracking must not break the farmer app.
    }
  }

  async function sendHeartbeat() {
    if (!auth.isAuthenticated) return;
    if (route.path.startsWith("/admin")) return;
    try {
      await authService.recordActivity();
    } catch {
      // Ignore transient heartbeat failures.
    }
  }

  function stopHeartbeat() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    timer = setInterval(() => {
      void sendHeartbeat();
    }, HEARTBEAT_MS);
  }

  watch(
    () => auth.isAuthenticated,
    (authed) => {
      stopHeartbeat();
      if (!authed) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }
      void recordSessionStartOnce();
      startHeartbeat();
    },
    { immediate: true },
  );
});
