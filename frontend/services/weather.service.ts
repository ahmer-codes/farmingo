import type {
  WeatherCurrentPayload,
  WeatherForecastPayload,
} from "~/types/weather";
import { apiRequest } from "./apiClient";

export const weatherService = {
  getCurrent(): Promise<WeatherCurrentPayload> {
    return apiRequest<WeatherCurrentPayload>("/weather/current");
  },

  getForecast(): Promise<WeatherForecastPayload> {
    return apiRequest<WeatherForecastPayload>("/weather/forecast");
  },
};
