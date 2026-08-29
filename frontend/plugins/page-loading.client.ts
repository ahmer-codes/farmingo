export default defineNuxtPlugin((nuxtApp) => {
  const { showPageLoading, startAdminPageLoading, stopAdminPageLoading } =
    useAdminPageLoading();
  let timer: ReturnType<typeof setTimeout> | null = null;

  function clearTimer() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function stopLoading() {
    clearTimer();
    stopAdminPageLoading();
  }

  const router = useRouter();

  router.beforeEach((to, from) => {
    if (!to.path.startsWith("/admin")) return;
    // Query/hash-only updates (e.g. selecting a chat) are not full page loads.
    if (to.path === from.path) return;
    clearTimer();
    startAdminPageLoading();
  });

  router.afterEach((to, from) => {
    if (to.path === from.path) {
      stopLoading();
    }
  });

  router.onError(() => {
    stopLoading();
  });

  nuxtApp.hook("page:start", () => {
    clearTimer();

    const path = import.meta.client ? window.location.pathname : "";
    if (path.startsWith("/admin")) {
      return;
    }

    timer = setTimeout(() => {
      showPageLoading.value = true;
    }, 500);
  });

  nuxtApp.hook("page:finish", stopLoading);
  nuxtApp.hook("app:error", stopLoading);
});
