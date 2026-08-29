<template>
  <Teleport to="body">
    <Transition name="admin-drawer">
      <div
        v-if="open"
        class="fixed inset-0 z-50 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation"
      >
        <button
          type="button"
          class="absolute inset-0 bg-ink/40"
          aria-label="Close navigation menu"
          @click="$emit('close')"
        />

        <aside
          class="absolute inset-y-0 left-0 flex w-[min(20rem,88vw)] flex-col overflow-hidden text-white shadow-xl relative"
        >
          <div class="admin-mobile-nav__gradient" aria-hidden="true" />
          <div class="relative z-10 flex min-h-0 flex-1 flex-col">
          <div
            class="flex items-center justify-between border-b border-white/10 px-4 py-4"
          >
            <div>
              <p class="text-base font-semibold">Farmingo Admin</p>
              <p class="text-xs text-white/70">Operations console</p>
            </div>
            <button
              type="button"
              class="inline-flex h-9 w-9 items-center justify-center rounded-md text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              aria-label="Close menu"
              @click="$emit('close')"
            >
              <UiAppIcon name="x" class="h-5 w-5" />
            </button>
          </div>

          <nav
            class="flex-1 space-y-0.5 overflow-y-auto p-3"
            aria-label="Admin navigation"
          >
            <AdminNavLink
              v-for="item in ADMIN_NAV_ITEMS"
              :key="item.to"
              :to="item.to"
              class="admin-drawer__link"
              :class="isActive(item.to) ? 'admin-drawer__link--active' : ''"
              @click="$emit('close')"
            >
              <UiNavIcon
                v-if="item.icon"
                :name="item.icon"
                class="h-4 w-4 shrink-0 opacity-90"
              />
              <span class="flex-1">{{ item.label }}</span>
              <span
                v-if="item.badgeKey === 'unreadChats' && unreadChats > 0"
                class="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold"
              >
                {{ unreadChats > 99 ? "99+" : unreadChats }}
              </span>
            </AdminNavLink>
          </nav>

          <div class="space-y-1 border-t border-white/10 p-3">
            <NuxtLink
              to="/dashboard"
              class="admin-drawer-footer-link"
              @click="$emit('close')"
            >
              <UiAppIcon name="chevron-left" size="sm" />
              Return to farmer app
            </NuxtLink>
            <button
              type="button"
              class="admin-drawer-footer-link admin-drawer-footer-link--danger"
              @click="onLogout"
            >
              Sign out
            </button>
          </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "~/constants/adminNav";

const props = defineProps<{
  open: boolean;
  unreadChats: number;
}>();

const emit = defineEmits<{ close: []; logout: [] }>();

const route = useRoute();

function isActive(path: string) {
  return isAdminNavActive(path, route.path);
}

function onLogout() {
  emit("close");
  emit("logout");
}

useOverlayEscape({
  active: () => props.open,
  onClose: () => emit("close"),
});
</script>

<style scoped>
.admin-mobile-nav__gradient {
  position: absolute;
  inset: 0;
  background: var(--admin-chrome-gradient);
}

.admin-drawer__link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  transition: background 0.15s ease;
}

.admin-drawer__link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.admin-drawer__link--active {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  font-weight: 600;
}

.admin-drawer-enter-active,
.admin-drawer-leave-active {
  transition: opacity 0.2s ease;
}

.admin-drawer-enter-from,
.admin-drawer-leave-to {
  opacity: 0;
}

.admin-drawer-enter-active aside,
.admin-drawer-leave-active aside {
  transition: transform 0.22s ease;
}

.admin-drawer-enter-from aside,
.admin-drawer-leave-to aside {
  transform: translateX(-100%);
}

.admin-drawer-footer-link {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.85);
  transition: background 0.15s ease;
}

.admin-drawer-footer-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.admin-drawer-footer-link--danger {
  color: #fecaca;
}

.admin-drawer-footer-link:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
