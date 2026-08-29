import type { AsyncState } from "~/types";
import type { DashboardOverview } from "~/types/dashboard";
import { dashboardService } from "~/services/dashboard.service";
import { useAuthStore } from "~/stores/auth";
import { useWeatherStore } from "~/stores/weather";
import {
  readDashboardCacheMeta,
  writeDashboardCache,
  isDashboardCacheFresh,
} from "~/utils/sessionCache";
import {
  weatherPayloadToRecommendations,
  weatherPayloadToSnapshot,
} from "~/utils/weatherSnapshot";

let loadRequestSeq = 0;

function mergeWeatherIntoOverview(
  core: Omit<
    DashboardOverview,
    "weather" | "weatherError" | "weatherStatus" | "recommendedActions"
  >,
  weatherStore: ReturnType<typeof useWeatherStore>,
): DashboardOverview {
  const payload = weatherStore.current;
  const hasWeather = Boolean(payload);
  const weatherError = hasWeather ? null : weatherStore.error;
  const weatherStatus = hasWeather
    ? "success"
    : weatherStore.status === "loading"
      ? "loading"
      : weatherStore.status === "error"
        ? "error"
        : "unavailable";

  return {
    ...core,
    weather: payload ? weatherPayloadToSnapshot(payload) : null,
    weatherError,
    weatherStatus,
    recommendedActions: payload ? weatherPayloadToRecommendations(payload) : [],
  };
}

function coreFromOverview(data: DashboardOverview) {
  return {
    farm: data.farm,
    overview: data.overview,
    crops: data.crops,
    alerts: data.alerts,
    tasks: data.tasks,
    yieldSeries: data.yieldSeries,
    analytics: data.analytics,
    recentActivity: data.recentActivity,
    unreadNotifications: data.unreadNotifications,
  };
}

export function useDashboard() {
  const authStore = useAuthStore();
  const weatherStore = useWeatherStore();
  const data = ref<DashboardOverview | null>(null);
  const state = ref<AsyncState>("idle");
  const error = ref("");
  const refreshing = ref(false);
  const weatherRefreshing = ref(false);

  const isInitialLoad = computed(
    () => (state.value === "loading" || state.value === "idle") && !data.value,
  );

  function applyWeatherToData() {
    if (!data.value) return;
    const merged = mergeWeatherIntoOverview(
      coreFromOverview(data.value),
      weatherStore,
    );
    data.value = { ...data.value, ...merged };
    const uid = authStore.firebaseUser?.uid;
    if (uid) writeDashboardCache(uid, data.value);
  }

  watch(
    () => weatherStore.current,
    (current) => {
      if (current && data.value) applyWeatherToData();
    },
  );

  watch(
    () => weatherStore.status,
    (status) => {
      if (!data.value) return;
      if (status === "loading" && !data.value.weather) {
        data.value = {
          ...data.value,
          weatherStatus: "loading",
          weatherError: null,
        };
      } else if (status === "error" && !data.value.weather) {
        applyWeatherToData();
      }
    },
  );

  async function fetchOverview(forceWeather = false) {
    const seq = ++loadRequestSeq;

    await authStore.refreshAccessToken();

    const [core] = await Promise.all([
      dashboardService.getOverview(authStore.farm),
      weatherStore.refresh({ force: forceWeather }).catch(() => null),
    ]);

    if (seq !== loadRequestSeq) return null;

    return mergeWeatherIntoOverview(core, weatherStore);
  }

  async function load(options: { force?: boolean } = {}) {
    if (import.meta.server) {
      state.value = "loading";
      return;
    }

    if (!data.value) {
      state.value = "loading";
    }
    error.value = "";

    const authed = await authStore.ensureReady();
    if (!authed) {
      state.value = "error";
      error.value = "Sign in to view your dashboard.";
      return;
    }

    const uid = authStore.firebaseUser?.uid;
    const hasData = Boolean(data.value);

    if (!options.force && uid) {
      const cached = readDashboardCacheMeta(uid);
      if (cached) {
        data.value = cached.data;
        state.value = "success";

        if (isDashboardCacheFresh(cached.cachedAt)) {
          if (!data.value?.weather || data.value.weatherError) {
            void weatherStore
              .refresh()
              .then(() => applyWeatherToData())
              .catch(() => undefined);
          }
          return;
        }

        refreshing.value = true;
        try {
          const overview = await fetchOverview(false);
          if (overview) {
            data.value = overview;
            writeDashboardCache(uid, overview);
          }
        } catch {
          // Keep cached dashboard if refresh fails.
        } finally {
          refreshing.value = false;
        }
        if (!data.value?.weather || data.value.weatherError) {
          void weatherStore
            .refresh()
            .then(() => applyWeatherToData())
            .catch(() => undefined);
        }
        return;
      }
    }

    if (hasData) {
      refreshing.value = true;
    }

    try {
      const overview = await fetchOverview(options.force);
      if (!overview) return;
      data.value = overview;
      state.value = overview ? "success" : "empty";
      if (overview && uid) writeDashboardCache(uid, overview);

      if (
        !overview.weather &&
        weatherStore.status === "error" &&
        import.meta.client
      ) {
        window.setTimeout(() => {
          void weatherStore
            .refresh({ force: true })
            .then(() => applyWeatherToData())
            .catch(() => undefined);
        }, 1200);
      }
    } catch (err) {
      if (!hasData) {
        state.value = "error";
      }
      error.value =
        err instanceof Error ? err.message : "Unable to load dashboard";
    } finally {
      refreshing.value = false;
    }
  }

  async function refreshInBackground() {
    if (!authStore.isAuthenticated) return;
    const uid = authStore.firebaseUser?.uid;
    refreshing.value = true;
    try {
      const overview = await fetchOverview(false);
      if (!overview) return;
      data.value = overview;
      state.value = "success";
      if (uid) writeDashboardCache(uid, overview);
    } catch {
      // Keep showing cached dashboard data.
    } finally {
      refreshing.value = false;
    }
  }

  async function refreshWeather() {
    if (!authStore.isAuthenticated || !data.value) return;
    weatherRefreshing.value = true;
    try {
      await weatherStore.refresh({ force: true });
      applyWeatherToData();
    } finally {
      weatherRefreshing.value = false;
    }
  }

  return {
    data,
    state,
    error,
    refreshing,
    weatherRefreshing,
    isInitialLoad,
    load,
    refreshWeather,
  };
}
