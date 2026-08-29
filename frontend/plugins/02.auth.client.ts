import { setAuthReadyChecker } from "~/services/authToken";

export default defineNuxtPlugin(async () => {
  const auth = useAuthStore();
  setAuthReadyChecker(() => auth.ensureReady());
  await auth.initialize();
});
