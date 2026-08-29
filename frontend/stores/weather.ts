import { defineStore } from "pinia";
import type {
  WeatherCurrentPayload,
  WeatherForecastPayload,
} from "~/types/weather";
import { weatherService } from "~/services/weather.service";
import { ApiClientError } from "~/services/apiClient";

interface WeatherState {
  current: WeatherCurrentPayload | null;
  forecast: WeatherForecastPayload | null;
  status: "idle" | "loading" | "success" | "error";
  error: string | null;
  errorStatus: number | null;
  lastFetchedAt: number | null;
  forecastLastFetchedAt: number | null;
  showingStale: boolean;
}

const STALE_MS = 10 * 60 * 1000;
const FORECAST_STALE_MS = 15 * 60 * 1000;

let currentInflight: Promise<WeatherCurrentPayload | null> | null = null;
let forecastInflight: Promise<WeatherForecastPayload | null> | null = null;
let currentRequestSeq = 0;
let forecastRequestSeq = 0;

function weatherErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) {
    if (err.status === 422) {
      return (
        err.message || "Farm location is missing or could not be resolved."
      );
    }
    if (err.status === 429) {
      return err.message || "Weather rate limit reached. Try again shortly.";
    }
    if (err.status === 404) {
      return err.message || "Farm profile not found.";
    }
    return err.message;
  }
  return err instanceof Error ? err.message : "Unable to load weather";
}

function isTransientWeatherError(err: unknown): boolean {
  if (!(err instanceof ApiClientError)) return true;
  return (
    err.status === 0 ||
    err.status === 502 ||
    err.status === 503 ||
    err.status === 504
  );
}

export const useWeatherStore = defineStore("weather", {
  state: (): WeatherState => ({
    current: null,
    forecast: null,
    status: "idle",
    error: null,
    errorStatus: null,
    lastFetchedAt: null,
    forecastLastFetchedAt: null,
    showingStale: false,
  }),

  getters: {
    summary(state): string {
      if (!state.current) return "Weather";
      const c = state.current.current;
      return `${c.temperatureC}° · ${c.condition}`;
    },
    locationLabel(state): string {
      if (!state.current) return "";
      const loc = state.current.location;
      return loc.farmLocation || loc.label;
    },
    isLoading(state): boolean {
      return state.status === "loading" && !state.current;
    },
    isUnavailable(state): boolean {
      return state.status === "error" && !state.current;
    },
  },

  actions: {
    async refresh(options: { force?: boolean } = {}) {
      const fresh =
        this.lastFetchedAt &&
        Date.now() - this.lastFetchedAt < STALE_MS &&
        this.current;
      if (fresh && !options.force) return this.current;

      if (currentInflight && !options.force) {
        return currentInflight;
      }

      const seq = ++currentRequestSeq;
      const hadCurrent = Boolean(this.current);
      if (!hadCurrent) {
        this.status = "loading";
      }
      this.error = null;
      this.errorStatus = null;

      const promise = this._fetchCurrent(seq, hadCurrent);
      currentInflight = promise;
      try {
        return await promise;
      } finally {
        if (currentInflight === promise) {
          currentInflight = null;
        }
      }
    },

    async _fetchCurrent(seq: number, hadCurrent: boolean, attempt = 0) {
      try {
        const payload = await weatherService.getCurrent();
        if (seq !== currentRequestSeq) return this.current;
        this.current = payload;
        this.lastFetchedAt = Date.now();
        this.status = "success";
        this.showingStale = payload.meta.stale;
        this.error = null;
        this.errorStatus = null;
        return payload;
      } catch (err) {
        if (seq !== currentRequestSeq) return this.current;

        if (isTransientWeatherError(err) && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 900));
          if (seq !== currentRequestSeq) return this.current;
          return this._fetchCurrent(seq, hadCurrent, attempt + 1);
        }

        const status = err instanceof ApiClientError ? err.status : 0;
        this.error = weatherErrorMessage(err);
        this.errorStatus = status;

        if (this.current) {
          this.showingStale = true;
          this.status = "success";
          return this.current;
        }

        this.status = "error";
        if (!hadCurrent) throw err;
        return null;
      }
    },

    async refreshForecast(options: { force?: boolean } = {}) {
      const fresh =
        this.forecastLastFetchedAt &&
        Date.now() - this.forecastLastFetchedAt < FORECAST_STALE_MS &&
        this.forecast;
      if (fresh && !options.force) return this.forecast;

      if (forecastInflight && !options.force) {
        return forecastInflight;
      }

      const seq = ++forecastRequestSeq;
      const promise = this._fetchForecast(seq);
      forecastInflight = promise;
      try {
        return await promise;
      } finally {
        if (forecastInflight === promise) {
          forecastInflight = null;
        }
      }
    },

    async _fetchForecast(seq: number) {
      try {
        const payload = await weatherService.getForecast();
        if (seq !== forecastRequestSeq) return this.forecast;
        this.forecast = payload;
        this.forecastLastFetchedAt = Date.now();
        return payload;
      } catch (err) {
        if (seq !== forecastRequestSeq) return this.forecast;
        if (this.forecast) return this.forecast;
        throw err;
      }
    },

    clear() {
      currentRequestSeq += 1;
      forecastRequestSeq += 1;
      currentInflight = null;
      forecastInflight = null;
      this.current = null;
      this.forecast = null;
      this.status = "idle";
      this.error = null;
      this.errorStatus = null;
      this.lastFetchedAt = null;
      this.forecastLastFetchedAt = null;
      this.showingStale = false;
    },
  },
});
