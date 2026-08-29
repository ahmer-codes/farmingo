import type { AsyncState } from "~/types";
import type {
  WeatherCurrentPayload,
  WeatherForecastPayload,
} from "~/types/weather";
import { useAuthStore } from "~/stores/auth";
import { useWeatherStore } from "~/stores/weather";

export function useWeather() {
  const authStore = useAuthStore();
  const weatherStore = useWeatherStore();

  const current = ref<WeatherCurrentPayload | null>(null);
  const forecast = ref<WeatherForecastPayload | null>(null);
  const state = ref<AsyncState>("idle");
  const error = ref("");
  const errorCode = ref<number | null>(null);
  const refreshing = ref(false);

  const isInitialLoad = computed(
    () => state.value === "loading" && !current.value,
  );

  async function load(
    options: { includeForecast?: boolean; force?: boolean } = {},
  ) {
    if (!authStore.isReady || !authStore.isAuthenticated) {
      state.value = "error";
      error.value = "Sign in to view weather for your farm.";
      errorCode.value = 401;
      return;
    }

    const hasData = Boolean(current.value);
    if (hasData) {
      refreshing.value = true;
    } else {
      state.value = "loading";
    }
    error.value = "";
    errorCode.value = null;

    try {
      const includeForecast = options.includeForecast !== false;
      const tasks: Promise<unknown>[] = [
        weatherStore.refresh({ force: options.force }),
      ];
      if (includeForecast) {
        tasks.push(weatherStore.refreshForecast({ force: options.force }));
      }
      await Promise.all(tasks);

      current.value = weatherStore.current;
      forecast.value = includeForecast ? weatherStore.forecast : forecast.value;
      errorCode.value = weatherStore.errorStatus;
      error.value = weatherStore.error || "";

      if (current.value) {
        state.value = "success";
      } else if (weatherStore.status === "error") {
        state.value = "error";
      } else {
        state.value = "empty";
      }
    } catch (err) {
      errorCode.value = weatherStore.errorStatus;
      error.value =
        weatherStore.error ||
        (err instanceof Error ? err.message : "Unable to load weather");

      if (weatherStore.current) {
        current.value = weatherStore.current;
        state.value = "success";
      } else {
        state.value = "error";
      }
    } finally {
      refreshing.value = false;
    }
  }

  return {
    current,
    forecast,
    state,
    error,
    errorCode,
    refreshing,
    isInitialLoad,
    load,
  };
}
