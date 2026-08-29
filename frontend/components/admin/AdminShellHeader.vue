<template>
  <header class="admin-shell-header">
    <div class="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
      <div class="min-w-0 flex-1 basis-0">
        <p class="admin-shell-header__label">Administration</p>
        <h1 class="admin-shell-header__title truncate">{{ title }}</h1>
      </div>

      <div
        class="order-last w-full md:order-none md:flex md:min-w-0 md:flex-1 md:justify-center"
      >
        <AdminAdminGlobalSearch class="mx-auto w-full max-w-md" />
      </div>

      <div class="flex items-center gap-2">
        <AdminNavLink
          to="/admin/chats"
          class="admin-shell-header__chip inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <UiAppIcon name="life-buoy" class="h-4 w-4" />
          <span class="hidden sm:inline">Support</span>
          <span
            v-if="unreadChats > 0"
            class="inline-flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
          >
            {{ unreadChats > 99 ? "99+" : unreadChats }}
          </span>
        </AdminNavLink>

        <NuxtLink
          to="/dashboard"
          class="admin-shell-header__chip hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:inline-flex"
        >
          <UiAppIcon name="chevron-left" size="sm" />
          Farmer app
        </NuxtLink>

        <UiAppButton
          size="sm"
          variant="secondary"
          class="admin-shell-header__signout hidden sm:inline-flex"
          @click="$emit('logout')"
        >
          Sign out
        </UiAppButton>

        <AdminAdminProfileMenu
          :name="adminName"
          :email="adminEmail"
          variant="chrome"
          @logout="$emit('logout')"
        />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  adminName: string;
  adminEmail: string;
  unreadChats: number;
}>();

defineEmits<{ "open-nav": []; logout: [] }>();
</script>

<style scoped>
.admin-shell-header__label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.admin-shell-header__title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.admin-shell-header__chip {
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.admin-shell-header__chip:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.55);
  color: #fff;
}

.admin-shell-header__signout {
  border-color: rgba(255, 255, 255, 0.35);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.admin-shell-header__signout:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.45);
  color: #fff;
}
</style>
