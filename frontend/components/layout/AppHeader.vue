<template>
  <header
    class="app-header sticky top-0 z-30 border-b border-white/10 bg-gradient-to-r from-[#4A535C] to-[#565C63]"
  >
    <div
      class="relative flex h-header items-center justify-between gap-3 px-4 lg:px-6"
    >
      <div class="flex min-w-0 items-center gap-3">
        <button
          type="button"
          class="header-icon-btn inline-flex min-h-11 min-w-11 items-center justify-center rounded-md lg:hidden"
          aria-label="Open navigation"
          @click="$emit('toggle-sidebar')"
        >
          <UiAppIcon name="menu" class="text-white" />
        </button>

        <div class="min-w-0">
          <nav
            v-if="breadcrumb.length"
            class="mb-0.5 hidden items-center gap-1.5 sm:flex"
            aria-label="Breadcrumb"
          >
            <template v-for="(crumb, index) in breadcrumb" :key="crumb">
              <span
                class="text-[11px] font-medium tracking-wide"
                :class="
                  index === breadcrumb.length - 1
                    ? 'text-white/90'
                    : 'text-white/65'
                "
              >
                {{ crumb }}
              </span>
              <span v-if="index < breadcrumb.length - 1" class="text-white/45"
                >/</span
              >
            </template>
          </nav>
          <h1
            class="header-title truncate text-base font-semibold tracking-tight md:text-lg"
          >
            {{ title }}
          </h1>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3">
        <div
          class="header-chip hidden min-h-[2.75rem] min-w-[8.5rem] items-center gap-2 rounded-md px-2.5 py-1.5 md:flex"
          title="Location weather context"
        >
          <UiNavIcon name="weather" class="shrink-0 text-brand-600" />
          <div
            v-if="weatherLoading"
            class="min-w-0 flex-1 space-y-1"
            aria-busy="true"
          >
            <UiSkeleton height="xs" width="sm" class="!w-20" />
            <UiSkeleton height="xs" width="xs" class="!w-16" />
          </div>
          <div v-else-if="weatherUnavailable" class="min-w-0 leading-tight">
            <p
              class="flex items-center gap-1 text-xs font-medium text-ink-muted"
            >
              <UiAppIcon
                name="alert-triangle"
                class="h-3 w-3 shrink-0 text-warning"
              />
              Weather unavailable
            </p>
            <p class="truncate text-[11px] text-ink-muted">
              {{ locationLabel }}
            </p>
          </div>
          <div v-else class="min-w-0 leading-tight">
            <p class="text-xs font-semibold tabular-nums text-ink">
              {{ weatherSummary }}
            </p>
            <p class="truncate text-[11px] text-ink-muted">
              {{ locationLabel }}
            </p>
          </div>
        </div>

        <NotificationsNotificationDropdown
          button-class="header-icon-btn"
          icon-class="text-white"
        />

        <div class="relative" ref="menuRoot">
          <button
            type="button"
            class="header-chip flex min-h-11 items-center gap-2 rounded-md py-1 pl-1 pr-2"
            aria-haspopup="menu"
            :aria-expanded="menuOpen"
            :aria-label="`Account menu for ${displayName}`"
            @click.stop="menuOpen = !menuOpen"
          >
            <img
              :src="avatarSrc"
              :alt="`${displayName} profile photo`"
              class="h-7 w-7 rounded-full object-cover"
            />
            <span
              class="hidden max-w-[7rem] truncate text-sm font-medium text-ink sm:inline"
            >
              {{ displayName }}
            </span>
          </button>

          <div
            v-if="menuOpen"
            class="absolute right-0 z-50 mt-2 w-48 rounded-md border border-line bg-white p-1 shadow-card"
            role="menu"
          >
            <NuxtLink
              to="/profile"
              class="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-canvas"
              role="menuitem"
              @click="menuOpen = false"
            >
              Profile
            </NuxtLink>
            <NuxtLink
              to="/settings"
              class="block rounded-sm px-3 py-2 text-sm text-ink hover:bg-canvas"
              role="menuitem"
              @click="menuOpen = false"
            >
              Settings
            </NuxtLink>
            <button
              type="button"
              class="block w-full rounded-sm px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
              role="menuitem"
              @click="onLogout"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import farmerPfp from "~/assets/farmer-pfp.jpeg";
import { useWeatherStore } from "~/stores/weather";
import { useNotificationStore } from "~/stores/notifications";
import { useAuthStore } from "~/stores/auth";
import { getAuthToken } from "~/services/authToken";
import { formatTemperatureC } from "~/utils/units";

const props = defineProps<{
  title: string;
  breadcrumb?: string[];
}>();

defineEmits<{ "toggle-sidebar": [] }>();

const authStore = useAuthStore();
const { displayName, farm, user, logout } = useAuth();
const weatherStore = useWeatherStore();
const notificationStore = useNotificationStore();
const menuOpen = ref(false);
const menuRoot = ref<HTMLElement | null>(null);

const avatarSrc = computed(() => user.value?.avatarUrl || farmerPfp);
const tempUnit = computed(
  () => user.value?.preferences.temperatureUnit || "celsius",
);

const locationLabel = computed(
  () => weatherStore.locationLabel || farm.value?.location || "Your farm",
);

const weatherSummary = computed(() => {
  if (!weatherStore.current) return "Weather";
  const c = weatherStore.current.current;
  return `${formatTemperatureC(c.temperatureC, tempUnit.value)} · ${c.condition}`;
});

const breadcrumb = computed(() => props.breadcrumb || []);

const weatherLoading = computed(
  () =>
    !authStore.isReady ||
    (authStore.isAuthenticated &&
      !weatherStore.current &&
      weatherStore.status !== "error"),
);

const weatherUnavailable = computed(
  () => authStore.isReady && weatherStore.isUnavailable,
);

async function loadHeaderWeather() {
  if (!authStore.isReady || !authStore.isAuthenticated) return;
  try {
    await weatherStore.refresh();
  } catch {
    // Store exposes error/unavailable; dashboard syncs from the same store.
  }
}

watch(
  () => authStore.isReady && authStore.isAuthenticated,
  (ready) => {
    if (ready) {
      void loadHeaderWeather();
      void getAuthToken()
        .then((token) => {
          notificationStore.refresh(token).catch(() => undefined);
        })
        .catch(() => undefined);
    }
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("click", onDocClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocClick);
});

function onDocClick(event: MouseEvent) {
  if (!menuRoot.value?.contains(event.target as Node)) menuOpen.value = false;
}

async function onLogout() {
  menuOpen.value = false;
  weatherStore.clear();
  notificationStore.reset();
  await logout();
  await navigateTo("/login");
}
</script>

<style scoped>
.header-title {
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.header-chip {
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
}

.header-chip:hover {
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(255, 255, 255, 0.72);
}
</style>
