<template>
  <aside
    class="admin-sidebar relative flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-white/10 text-white shadow-lg"
    aria-label="Admin navigation"
  >
    <div class="admin-sidebar__gradient" aria-hidden="true" />

    <div class="relative z-10 flex h-full min-h-0 flex-col">
      <div class="shrink-0 border-b border-white/15 px-4 py-4">
        <p class="text-base font-semibold text-white">Farmingo Admin</p>
        <p class="text-xs text-brand-100">Operations console</p>
      </div>

      <nav class="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-3">
        <AdminNavLink
          v-for="item in ADMIN_NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="admin-sidebar__link"
          :class="isActive(item.to) ? 'admin-sidebar__link--active' : ''"
        >
          <UiNavIcon
            v-if="item.icon"
            :name="item.icon"
            class="admin-sidebar__icon"
          />
          <span class="flex-1">{{ item.label }}</span>
          <span
            v-if="item.badgeKey === 'unreadChats' && unreadChats > 0"
            class="rounded-full bg-danger px-2 py-0.5 text-[10px] font-bold"
            :aria-label="`${unreadChats} unread`"
          >
            {{ unreadChats > 99 ? "99+" : unreadChats }}
          </span>
        </AdminNavLink>
      </nav>

      <div class="shrink-0 space-y-1 border-t border-white/10 p-3">
        <NuxtLink to="/dashboard" class="admin-sidebar-footer-link">
          <UiAppIcon name="chevron-left" size="sm" />
          Return to farmer app
        </NuxtLink>
        <button
          type="button"
          class="admin-sidebar-footer-link admin-sidebar-footer-link--danger"
          @click="$emit('logout')"
        >
          Sign out
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "~/constants/adminNav";

defineProps<{ unreadChats?: number }>();

defineEmits<{ logout: [] }>();

const route = useRoute();

function isActive(path: string) {
  return isAdminNavActive(path, route.path);
}
</script>

<style scoped>
.admin-sidebar__gradient {
  position: absolute;
  inset: 0;
  background: var(--admin-chrome-gradient);
}

.admin-sidebar__link {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #f2f7f3;
  transition:
    background 0.15s ease,
    color 0.15s ease;
}

.admin-sidebar__link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.admin-sidebar__link--active {
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 600;
  box-shadow: inset 3px 0 0 #c5d9cb;
}

.admin-sidebar__link:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}

.admin-sidebar__icon {
  flex-shrink: 0;
  opacity: 0.9;
}

.admin-sidebar-footer-link {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.5rem;
  border-radius: calc(var(--radius-md) - 2px);
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 500;
  color: #e8f0ea;
  transition: background 0.15s ease;
}

.admin-sidebar-footer-link:hover {
  background: rgba(255, 255, 255, 0.1);
}

.admin-sidebar-footer-link--danger {
  color: #fecaca;
}

.admin-sidebar-footer-link:focus-visible {
  outline: 2px solid white;
  outline-offset: 2px;
}
</style>
