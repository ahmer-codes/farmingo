<template>
  <nav class="admin-top-nav" aria-label="Admin pages">
    <div class="admin-top-nav__bar">
      <button
        type="button"
        class="admin-top-nav__menu md:hidden"
        aria-label="Open admin navigation menu"
        @click="$emit('open-nav')"
      >
        <UiAppIcon name="menu" class="h-5 w-5" />
      </button>

      <div class="admin-top-nav__scroll">
        <AdminNavLink
          v-for="item in ADMIN_NAV_ITEMS"
          :key="item.to"
          :to="item.to"
          class="admin-top-nav__link"
          :class="{ 'admin-top-nav__link--active': isActive(item.to) }"
        >
          <UiNavIcon
            v-if="item.icon"
            :name="item.icon"
            class="admin-top-nav__icon"
          />
          <span>{{ item.label }}</span>
          <span
            v-if="item.badgeKey === 'unreadChats' && unreadChats > 0"
            class="admin-top-nav__badge"
            :aria-label="`${unreadChats} unread`"
          >
            {{ unreadChats > 99 ? "99+" : unreadChats }}
          </span>
        </AdminNavLink>
      </div>

      <div class="admin-top-nav__actions md:hidden">
        <AdminAdminProfileMenu
          :name="adminName"
          :email="adminEmail"
          variant="chrome"
          @logout="$emit('logout')"
        />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ADMIN_NAV_ITEMS, isAdminNavActive } from "~/constants/adminNav";

defineProps<{
  unreadChats?: number;
  adminName?: string;
  adminEmail?: string;
}>();

defineEmits<{ "open-nav": []; logout: [] }>();

const route = useRoute();

function isActive(path: string) {
  return isAdminNavActive(path, route.path);
}
</script>

<style scoped>
.admin-top-nav__bar {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding-right: 0.5rem;
}

.admin-top-nav__menu {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  margin-left: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.35);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.admin-top-nav__menu:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.admin-top-nav__scroll {
  display: flex;
  min-width: 0;
  flex: 1;
  gap: 0.375rem;
  overflow-x: auto;
  padding: 0.375rem 0.25rem 0.5rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .admin-top-nav__bar {
    padding-right: 0;
  }

  .admin-top-nav__scroll {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}

.admin-top-nav__scroll::-webkit-scrollbar {
  height: 4px;
}

.admin-top-nav__scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 9999px;
}

.admin-top-nav__actions {
  flex-shrink: 0;
}

.admin-top-nav__link {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.375rem;
  border-radius: 9999px;
  border: 1px solid transparent;
  padding: 0.4375rem 0.875rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.82);
  white-space: nowrap;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.admin-top-nav__link:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.admin-top-nav__link--active {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  font-weight: 600;
}

.admin-top-nav__link:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.admin-top-nav__icon {
  opacity: 0.88;
}

.admin-top-nav__link--active .admin-top-nav__icon {
  opacity: 1;
}

.admin-top-nav__badge {
  display: inline-flex;
  min-width: 1.125rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: var(--color-danger);
  padding: 0.0625rem 0.375rem;
  font-size: 0.625rem;
  font-weight: 700;
  line-height: 1.2;
  color: #fff;
}
</style>
