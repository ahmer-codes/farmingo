import { env } from "../../config";
import { OpenMeteoWeatherProvider } from "./openMeteo.provider";
import { OpenWeatherMapProvider } from "./openWeatherMap.provider";
import type { WeatherProvider } from "./types";

/**
 * Select weather provider from env.
 * Default: Open-Meteo (real API, no key).
 * Optional: OpenWeatherMap when WEATHER_API_KEY + WEATHER_PROVIDER=openweathermap.
 */
export function createWeatherProvider(): WeatherProvider {
  const preferred = (process.env.WEATHER_PROVIDER || "").toLowerCase();

  if (
    preferred === "openweathermap" ||
    (preferred === "" && env.WEATHER_API_KEY)
  ) {
    if (!env.WEATHER_API_KEY) {
      console.warn(
        "[weather] WEATHER_PROVIDER=openweathermap but WEATHER_API_KEY is empty; falling back to Open-Meteo",
      );
      return new OpenMeteoWeatherProvider();
    }
    return new OpenWeatherMapProvider(
      env.WEATHER_API_KEY,
      env.WEATHER_API_BASE_URL,
    );
  }

  return new OpenMeteoWeatherProvider();
}
