<template>
  <div class="admin-layout relative h-screen overflow-hidden">
    <div
      class="admin-layout__bg"
      :style="{ backgroundImage: `url(${farmerAdminBg})` }"
      aria-hidden="true"
    />
    <div class="admin-layout__overlay" aria-hidden="true" />

    <div class="relative z-10 flex h-full min-h-0">
      <AdminSidebar
        :unread-chats="unreadChats"
        class="admin-layout__sidebar"
        @logout="onLogout"
      />

      <div class="admin-layout__content flex min-h-0 min-w-0 flex-1 flex-col">
        <div class="admin-layout__chrome shrink-0">
          <AdminShellHeader
            class="hidden md:block"
            :title="pageTitle"
            :admin-name="adminName"
            :admin-email="adminEmail"
            :unread-chats="unreadChats"
            @open-nav="mobileNavOpen = true"
            @logout="onLogout"
          />
          <AdminTopNav
            :unread-chats="unreadChats"
            :admin-name="adminName"
            :admin-email="adminEmail"
            class="admin-layout__top-nav--mobile"
            @open-nav="mobileNavOpen = true"
            @logout="onLogout"
          />
        </div>

        <main id="admin-main" class="admin-layout__main">
          <div
            class="admin-layout__page"
            :class="{ 'admin-layout__page--loading': showPageLoading }"
            :aria-hidden="showPageLoading"
          >
            <slot />
          </div>

          <div
            v-if="showPageLoading"
            class="admin-layout__loading"
            role="status"
            aria-live="polite"
            aria-label="Loading page"
          >
            <div class="admin-layout__loading-card">
              <UiLoadingDots size="md" label="Loading page" show-label />
              <p class="admin-layout__loading-text">Loading page…</p>
            </div>
          </div>
        </main>
      </div>
    </div>

    <AdminMobileNav
      :open="mobileNavOpen"
      :unread-chats="unreadChats"
      @close="closeMobileNav"
      @logout="onLogout"
    />

    <UiConfirmDialog />
    <UiToastHost />
  </div>
</template>

<script setup lang="ts">
import farmerAdminBg from '~/assets/farmer-admin.jpg'
import AdminSidebar from '~/components/admin/AdminSidebar.vue'
import AdminShellHeader from '~/components/admin/AdminShellHeader.vue'
import AdminTopNav from '~/components/admin/AdminTopNav.vue'
import AdminMobileNav from '~/components/admin/AdminMobileNav.vue'

const {
  unreadChats,
  mobileNavOpen,
  pageTitle,
  adminName,
  adminEmail,
  refreshStats,
  closeMobileNav,
} = useAdminShell()

const showPageLoading = useState('delayed-page-loading', () => false)

const { logout } = useAuth()
const authStore = useAuthStore()

onMounted(() => {
  void refreshStats()
  if (!authStore.user && authStore.isAuthenticated) {
    void authStore.fetchMe()
  }
})

async function onLogout() {
  await logout()
  await navigateTo({ path: '/login', query: { admin: '1', redirect: '/admin' } })
}
</script>

<style scoped>
.admin-layout {
  width: 100%;
  overflow-x: hidden;
}

.admin-layout__bg {
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.admin-layout__overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(
    160deg,
    rgba(12, 36, 21, 0.78) 0%,
    rgba(20, 61, 36, 0.72) 42%,
    rgba(16, 47, 28, 0.8) 100%
  );
}

.admin-layout__chrome {
  z-index: 50;
  flex-shrink: 0;
  background: var(--admin-chrome-gradient);
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.22);
}

.admin-layout__sidebar {
  display: none;
}

@media (min-width: 768px) {
  .admin-layout__sidebar {
    display: flex;
    height: 100%;
    max-height: 100%;
    flex-shrink: 0;
    overflow: hidden;
  }

  .admin-layout__content {
    min-width: 0;
    flex: 1;
    min-height: 0;
  }
}

.admin-layout__top-nav--mobile {
  display: block;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

@media (min-width: 768px) {
  .admin-layout__top-nav--mobile {
    display: none;
  }
}

.admin-layout__main {
  position: relative;
  flex: 1;
  min-height: 0;
  min-width: 0;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0.625rem 0.75rem;
  color: #f8faf9;
  -webkit-overflow-scrolling: touch;
}

.admin-layout__page--loading {
  visibility: hidden;
  pointer-events: none;
}

.admin-layout__loading {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 4rem;
  background: rgba(12, 36, 21, 0.42);
  backdrop-filter: blur(3px);
}

.admin-layout__loading-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  padding: 1rem 1.5rem;
  border-radius: calc(var(--radius-md) + 2px);
  border: 1px solid #c5d9cb;
  background: var(--color-brand-soft);
  box-shadow: 0 10px 28px rgba(15, 23, 20, 0.18);
}

.admin-layout__loading-text {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink-secondary);
}

.admin-layout__main :deep(h1),
.admin-layout__main :deep(h2),
.admin-layout__main :deep(.text-ink) {
  color: #fff;
}

.admin-layout__main :deep(.text-ink-secondary) {
  color: rgba(255, 255, 255, 0.9);
}

.admin-layout__main :deep(.text-ink-muted) {
  color: rgba(255, 255, 255, 0.75);
}

.admin-layout__main :deep(.type-helper),
.admin-layout__main :deep(.type-body) {
  color: rgba(255, 255, 255, 0.88);
}

.admin-layout__main :deep(.type-label) {
  color: rgba(255, 255, 255, 0.72);
}

.admin-layout__main :deep(.type-page-title),
.admin-layout__main :deep(.type-section),
.admin-layout__main :deep(.type-card-title) {
  color: #fff;
}

@media (min-width: 640px) {
  .admin-layout__main {
    padding: 1rem 1rem;
  }
}

@media (min-width: 768px) {
  .admin-layout__main {
    padding: 1.25rem 1.5rem;
  }
}

.admin-layout__main :deep(.surface-card) {
  background: var(--color-brand-soft);
  border-color: #c5d9cb;
  color: var(--color-ink);
}

.admin-layout__main :deep(.surface-card h1),
.admin-layout__main :deep(.surface-card h2),
.admin-layout__main :deep(.surface-card h3),
.admin-layout__main :deep(.surface-card .text-ink),
.admin-layout__main :deep(.surface-card .type-page-title),
.admin-layout__main :deep(.surface-card .type-section),
.admin-layout__main :deep(.surface-card .type-card-title) {
  color: var(--color-ink);
}

.admin-layout__main :deep(.surface-card .text-ink-secondary),
.admin-layout__main :deep(.surface-card .type-body) {
  color: var(--color-ink-secondary);
}

.admin-layout__main :deep(.surface-card .text-ink-muted),
.admin-layout__main :deep(.surface-card .type-helper),
.admin-layout__main :deep(.surface-card .type-label) {
  color: var(--color-ink-muted);
}

.admin-layout__main :deep(.surface-panel) {
  background: var(--color-brand-soft);
  border-color: #c5d9cb;
  color: var(--color-ink);
}

/* Panels/cards with explicit white backgrounds keep dark text */
.admin-layout__main :deep(.bg-white),
.admin-layout__main :deep(.bg-white *) {
  color: var(--color-ink);
}

.admin-layout__main :deep(.bg-white .text-ink-secondary),
.admin-layout__main :deep(.bg-white .type-helper),
.admin-layout__main :deep(.bg-white .type-body) {
  color: var(--color-ink-secondary);
}

.admin-layout__main :deep(.bg-white .text-ink-muted),
.admin-layout__main :deep(.bg-white .type-label) {
  color: var(--color-ink-muted);
}
</style>
