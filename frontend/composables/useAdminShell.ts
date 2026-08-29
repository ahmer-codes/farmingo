import { adminService } from "~/services/admin.service";
import { resolveAdminPageTitle } from "~/constants/adminNav";

export function useAdminShell() {
  const route = useRoute();
  const authStore = useAuthStore();

  const unreadChats = ref(0);
  const openChats = ref(0);
  const mobileNavOpen = ref(false);
  const statsLoading = ref(false);
  let statsInflight: Promise<void> | null = null;

  const pageTitle = computed(() => resolveAdminPageTitle(route.path));

  const adminName = computed(() => authStore.user?.fullName || "Administrator");
  const adminEmail = computed(
    () => authStore.user?.email || authStore.firebaseUser?.email || "",
  );

  async function refreshStats() {
    if (statsInflight) {
      await statsInflight;
      return;
    }

    statsLoading.value = true;
    const run = (async () => {
      try {
        const stats = await adminService.chatStats();
        unreadChats.value = stats.unreadConversations;
        openChats.value = stats.openConversations;
      } catch {
        unreadChats.value = 0;
        openChats.value = 0;
      } finally {
        statsLoading.value = false;
      }
    })();

    statsInflight = run;
    try {
      await run;
    } finally {
      if (statsInflight === run) {
        statsInflight = null;
      }
    }
  }

  function closeMobileNav() {
    mobileNavOpen.value = false;
  }

  watch(
    () => route.path,
    () => {
      closeMobileNav();
      void refreshStats();
    },
  );

  return {
    unreadChats,
    openChats,
    mobileNavOpen,
    statsLoading,
    pageTitle,
    adminName,
    adminEmail,
    refreshStats,
    closeMobileNav,
  };
}
