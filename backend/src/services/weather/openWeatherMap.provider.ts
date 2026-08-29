import { env } from "../../config";
import { ApiError } from "../../utils/ApiError";
import type {
  CurrentWeather,
  DailyForecastItem,
  GeoCoordinates,
  HourlyForecastItem,
  TodaySummary,
  WeatherBundle,
  WeatherProvider,
} from "./types";
import { round1 } from "./wmo";

interface OwmCurrentResponse {
  name?: string;
  weather?: Array<{ id: number; main: string; description: string }>;
  main?: {
    temp: number;
    feels_like: number;
    humidity: number;
    temp_min?: number;
    temp_max?: number;
  };
  wind?: { speed: number };
  rain?: { "1h"?: number; "3h"?: number };
  sys?: { sunrise?: number; sunset?: number };
  dt?: number;
  cod?: number | string;
  message?: string;
}

interface OwmForecastResponse {
  list?: Array<{
    dt: number;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      temp_min: number;
      temp_max: number;
    };
    weather: Array<{ id: number; main: string; description: string }>;
    wind: { speed: number };
    pop: number;
    rain?: { "3h"?: number };
    dt_txt: string;
  }>;
  city?: {
    name?: string;
    sunrise?: number;
    sunset?: number;
  };
  cod?: string;
  message?: string | number;
}

/**
 * OpenWeatherMap provider, used when WEATHER_API_KEY is configured.
 * Keys stay on the server only.
 */
export class OpenWeatherMapProvider implements WeatherProvider {
  readonly name = "openweathermap";

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl = env.WEATHER_API_BASE_URL,
  ) {}

  async fetchWeather(coords: GeoCoordinates): Promise<WeatherBundle> {
    const [currentRaw, forecastRaw] = await Promise.all([
      this.getJson<OwmCurrentResponse>("/weather", coords),
      this.getJson<OwmForecastResponse>("/forecast", coords),
    ]);

    const fetchedAt = new Date().toISOString();
    const current = mapCurrent(currentRaw, forecastRaw);
    const hourly = mapHourly(forecastRaw);
    const daily = mapDaily(forecastRaw, currentRaw);
    const today = mapToday(daily, hourly, current);

    return {
      location: {
        ...coords,
        label: currentRaw.name || coords.label,
      },
      current,
      today,
      hourly,
      daily,
      fetchedAt,
      provider: this.name,
    };
  }

  private async getJson<T>(path: string, coords: GeoCoordinates): Promise<T> {
    const url = new URL(`${this.baseUrl.replace(/\/$/, "")}${path}`);
    url.searchParams.set("lat", String(coords.latitude));
    url.searchParams.set("lon", String(coords.longitude));
    url.searchParams.set("appid", this.apiKey);
    url.searchParams.set("units", "metric");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new ApiError(502, "Unable to reach weather provider");
    }

    if (response.status === 401) {
      throw new ApiError(502, "Weather provider authentication failed");
    }
    if (response.status === 429) {
      throw new ApiError(
        429,
        "Weather provider rate limit reached. Try again shortly.",
      );
    }
    if (!response.ok) {
      throw new ApiError(502, "Weather provider returned an error");
    }

    return (await response.json()) as T;
  }
}

function conditionFromOwm(id: number, fallback: string): string {
  if (id >= 200 && id < 300) return "Thunderstorm";
  if (id >= 300 && id < 400) return "Drizzle";
  if (id >= 500 && id < 600) return "Rain";
  if (id >= 600 && id < 700) return "Snow";
  if (id >= 700 && id < 800) return "Haze";
  if (id === 800) return "Clear";
  if (id === 801) return "Mainly clear";
  if (id === 802) return "Partly cloudy";
  if (id >= 803) return "Overcast";
  return fallback || "Unknown";
}

function mapCurrent(
  data: OwmCurrentResponse,
  forecast: OwmForecastResponse,
): CurrentWeather {
  const weather = data.weather?.[0];
  const code = weather?.id ?? 0;
  const nextPop = Math.round((forecast.list?.[0]?.pop ?? 0) * 100);

  return {
    temperatureC: round1(data.main?.temp ?? 0),
    feelsLikeC: round1(data.main?.feels_like ?? 0),
    humidityPercent: Math.round(data.main?.humidity ?? 0),
    windKph: Math.round((data.wind?.speed ?? 0) * 3.6),
    rainfallMm: round1(data.rain?.["1h"] ?? data.rain?.["3h"] ?? 0),
    precipitationProbabilityPercent: nextPop,
    condition: conditionFromOwm(code, weather?.main || ""),
    conditionCode: code,
    sunrise: data.sys?.sunrise
      ? new Date(data.sys.sunrise * 1000).toISOString()
      : undefined,
    sunset: data.sys?.sunset
      ? new Date(data.sys.sunset * 1000).toISOString()
      : undefined,
    observedAt: data.dt
      ? new Date(data.dt * 1000).toISOString()
      : new Date().toISOString(),
  };
}

function mapHourly(data: OwmForecastResponse): HourlyForecastItem[] {
  return (data.list || []).slice(0, 16).map((item) => {
    const weather = item.weather[0];
    const code = weather?.id ?? 0;
    return {
      time: new Date(item.dt * 1000).toISOString(),
      temperatureC: round1(item.main.temp),
      feelsLikeC: round1(item.main.feels_like),
      humidityPercent: Math.round(item.main.humidity),
      windKph: Math.round(item.wind.speed * 3.6),
      rainfallMm: round1(item.rain?.["3h"] ?? 0),
      precipitationProbabilityPercent: Math.round(item.pop * 100),
      condition: conditionFromOwm(code, weather?.main || ""),
      conditionCode: code,
    };
  });
}

function mapDaily(
  forecast: OwmForecastResponse,
  current: OwmCurrentResponse,
): DailyForecastItem[] {
  const byDay = new Map<
    string,
    {
      highs: number[];
      lows: number[];
      rain: number;
      pops: number[];
      winds: number[];
      codes: number[];
      labels: string[];
    }
  >();

  for (const item of forecast.list || []) {
    const date = item.dt_txt.slice(0, 10);
    const bucket = byDay.get(date) || {
      highs: [],
      lows: [],
      rain: 0,
      pops: [],
      winds: [],
      codes: [],
      labels: [],
    };
    bucket.highs.push(item.main.temp_max);
    bucket.lows.push(item.main.temp_min);
    bucket.rain += item.rain?.["3h"] ?? 0;
    bucket.pops.push(item.pop);
    bucket.winds.push(item.wind.speed * 3.6);
    const w = item.weather[0];
    bucket.codes.push(w?.id ?? 0);
    bucket.labels.push(w?.main || "Unknown");
    byDay.set(date, bucket);
  }

  const sunrise = current.sys?.sunrise
    ? new Date(current.sys.sunrise * 1000).toISOString()
    : undefined;
  const sunset = current.sys?.sunset
    ? new Date(current.sys.sunset * 1000).toISOString()
    : undefined;

  return Array.from(byDay.entries())
    .slice(0, 7)
    .map(([date, bucket], index) => {
      const mid = Math.floor(bucket.codes.length / 2);
      const code = bucket.codes[mid] ?? 0;
      return {
        date,
        highC: round1(Math.max(...bucket.highs)),
        lowC: round1(Math.min(...bucket.lows)),
        rainfallMm: round1(bucket.rain),
        precipProbabilityMax: Math.round(Math.max(...bucket.pops, 0) * 100),
        windMaxKph: Math.round(Math.max(...bucket.winds, 0)),
        condition: conditionFromOwm(code, bucket.labels[mid] || "Unknown"),
        conditionCode: code,
        sunrise: index === 0 ? sunrise : undefined,
        sunset: index === 0 ? sunset : undefined,
      };
    });
}

function mapToday(
  daily: DailyForecastItem[],
  hourly: HourlyForecastItem[],
  current: CurrentWeather,
): TodaySummary {
  const today = daily[0];
  if (today) {
    return {
      highC: today.highC,
      lowC: today.lowC,
      rainfallMm: today.rainfallMm,
      precipProbabilityMax: today.precipProbabilityMax,
    };
  }
  return {
    highC: current.temperatureC,
    lowC: current.temperatureC,
    rainfallMm: current.rainfallMm,
    precipProbabilityMax: current.precipitationProbabilityPercent,
  };
}
