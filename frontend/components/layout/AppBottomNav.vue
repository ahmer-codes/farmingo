<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    aria-label="Primary mobile"
  >
    <ul class="grid h-bottom-nav grid-cols-5">
      <li v-for="item in mobileNav" :key="item.to" class="min-w-0">
        <NuxtLink
          :to="item.to"
          class="flex h-full min-h-[var(--bottom-nav-height)] flex-col items-center justify-center gap-0.5 px-0.5 text-[10px] font-medium leading-tight"
          :class="isActive(item) ? 'text-brand-600' : 'text-ink-muted'"
        >
          <UiNavIcon :name="item.icon" />
          <span class="max-w-full truncate">{{ item.label }}</span>
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import type { NavItem } from "~/types";

const route = useRoute();
const { mobileNav } = useNavigation();

const accountPaths = ["/profile", "/settings", "/notifications"];

function isActive(item: NavItem) {
  if (item.label === "More") {
    return accountPaths.some(
      (p) => route.path === p || route.path.startsWith(`${p}/`),
    );
  }
  return route.path === item.to || route.path.startsWith(`${item.to}/`);
}
</script>
