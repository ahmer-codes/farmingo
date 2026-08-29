<template>
  <aside
    class="fixed inset-y-0 left-0 z-40 w-sidebar overflow-hidden transition-transform duration-200 lg:translate-x-0"
    :class="open ? 'translate-x-0' : '-translate-x-full'"
  >
    <img
      :src="sidebarBgSrc"
      alt=""
      class="absolute inset-0 h-full w-full scale-105 object-cover brightness-[0.55] saturate-[0.85]"
      loading="lazy"
    />
    <div class="absolute inset-0 bg-brand-950/78" aria-hidden="true" />
    <div
      class="absolute inset-0 bg-gradient-to-b from-brand-950/95 via-brand-900/88 to-brand-950/82"
      aria-hidden="true"
    />

    <div
      class="relative z-10 flex h-full flex-col border-r border-white/10 text-white sidebar-readable"
    >
      <div
        class="flex h-header items-center gap-3 border-b border-white/15 px-4"
      >
        <img
          :src="logoSrc"
          alt="Farmingo"
          class="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/25"
        />
        <div class="min-w-0">
          <p class="truncate text-base font-semibold tracking-tight text-white">
            Farmingo
          </p>
          <p class="truncate text-[11px] text-white/75">Farmer assistant</p>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-3 py-4">
        <p class="sidebar-section-label mb-2 px-2">Main</p>
        <nav class="space-y-0.5" aria-label="Primary">
          <NuxtLink
            v-for="item in primaryNav"
            :key="item.to"
            :to="item.to"
            class="sidebar-nav-link flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
            :class="linkClass(item.to)"
            @click="onNavigate"
          >
            <UiNavIcon :name="item.icon" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <p class="sidebar-section-label mb-2 mt-6 px-2">Account</p>
        <nav class="space-y-0.5" aria-label="Secondary">
          <NuxtLink
            v-for="item in secondaryNav"
            :key="item.to"
            :to="item.to"
            class="sidebar-nav-link flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors"
            :class="linkClass(item.to)"
            @click="onNavigate"
          >
            <UiNavIcon :name="item.icon" />
            <span class="font-medium">{{ item.label }}</span>
          </NuxtLink>
        </nav>
      </div>

      <div
        class="border-t border-white/15 bg-brand-950/35 px-4 py-3 backdrop-blur-[2px]"
      >
        <p
          class="text-[11px] font-medium uppercase tracking-wide text-white/60"
        >
          Signed in
        </p>
        <p class="truncate text-sm font-semibold text-white">
          {{ displayName }}
        </p>
        <p class="truncate text-xs text-white/80">{{ farmName }}</p>
        <button
          type="button"
          class="mt-3 inline-flex w-full items-center justify-center rounded-md border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-white/45 hover:bg-white/15"
          @click="onSignOut"
        >
          Sign out
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import logoUrl from "~/assets/Logo.png";
import sidebarBgUrl from "~/assets/sidebar-bg.jpeg";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ navigate: [] }>();

const route = useRoute();
const { displayName, farm, logout } = useAuth();
const { primaryNav, secondaryNav } = useNavigation();
const logoSrc = logoUrl;
const sidebarBgSrc = sidebarBgUrl;

const farmName = computed(() => farm.value?.name || "Your farm");

function isActive(path: string) {
  return route.path === path || route.path.startsWith(`${path}/`);
}

function linkClass(path: string) {
  return isActive(path)
    ? "bg-white/20 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
    : "text-white/90 hover:bg-white/12 hover:text-white";
}

function onNavigate() {
  emit("navigate");
}

async function onSignOut() {
  emit("navigate");
  await logout();
  await navigateTo("/login");
}
</script>

<style scoped>
.sidebar-readable {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
}

.sidebar-section-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  line-height: 1.4;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.72);
}

.sidebar-nav-link :deep(svg) {
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}
</style>
