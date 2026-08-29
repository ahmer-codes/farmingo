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
import { conditionFromWmoCode, round1 } from "./wmo";

interface OpenMeteoForecastResponse {
  timezone?: string;
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  hourly?: {
    time: string[];
    temperature_2m: number[];
    apparent_temperature?: number[];
    relative_humidity_2m?: number[];
    precipitation?: number[];
    precipitation_probability?: number[];
    weather_code?: number[];
    wind_speed_10m?: number[];
  };
  daily?: {
    time: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    sunrise?: string[];
    sunset?: string[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
}

/**
 * Open-Meteo forecast provider, real weather data, no API key.
 * https://open-meteo.com/en/docs
 */
export class OpenMeteoWeatherProvider implements WeatherProvider {
  readonly name = "open-meteo";

  constructor(private readonly baseUrl = "https://api.open-meteo.com/v1") {}

  async fetchWeather(coords: GeoCoordinates): Promise<WeatherBundle> {
    const url = new URL(`${this.baseUrl}/forecast`);
    url.searchParams.set("latitude", String(coords.latitude));
    url.searchParams.set("longitude", String(coords.longitude));
    url.searchParams.set(
      "current",
      [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "precipitation",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
    );
    url.searchParams.set(
      "hourly",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "precipitation_probability",
        "weather_code",
        "wind_speed_10m",
      ].join(","),
    );
    url.searchParams.set(
      "daily",
      [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
        "precipitation_sum",
        "precipitation_probability_max",
        "wind_speed_10m_max",
      ].join(","),
    );
    url.searchParams.set("timezone", "auto");
    url.searchParams.set("forecast_days", "7");
    // Open-Meteo returns wind in km/h when this unit is set
    url.searchParams.set("wind_speed_unit", "kmh");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new ApiError(502, "Unable to reach weather provider");
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

    const data = (await response.json()) as OpenMeteoForecastResponse;
    if (!data.current || !data.hourly || !data.daily) {
      throw new ApiError(502, "Weather provider returned incomplete data");
    }

    const fetchedAt = new Date().toISOString();
    const current = mapCurrent(data);
    const hourly = mapHourly(data);
    const daily = mapDaily(data);
    const today = mapToday(daily, hourly, current);

    return {
      location: {
        ...coords,
        timezone: data.timezone || coords.timezone,
      },
      current,
      today,
      hourly,
      daily,
      fetchedAt,
      provider: this.name,
    };
  }
}

function mapCurrent(data: OpenMeteoForecastResponse): CurrentWeather {
  const c = data.current!;
  const code = c.weather_code;
  const nextHourPrecip = data.hourly?.precipitation_probability?.[0] ?? 0;

  return {
    temperatureC: round1(c.temperature_2m),
    feelsLikeC: round1(c.apparent_temperature),
    humidityPercent: Math.round(c.relative_humidity_2m),
    windKph: Math.round(c.wind_speed_10m),
    rainfallMm: round1(c.precipitation),
    precipitationProbabilityPercent: Math.round(nextHourPrecip),
    condition: conditionFromWmoCode(code),
    conditionCode: code,
    sunrise: data.daily?.sunrise?.[0],
    sunset: data.daily?.sunset?.[0],
    observedAt: c.time,
  };
}

function mapHourly(data: OpenMeteoForecastResponse): HourlyForecastItem[] {
  const h = data.hourly!;
  const now = Date.now();
  const items: HourlyForecastItem[] = [];

  for (let i = 0; i < h.time.length; i++) {
    const time = h.time[i]!;
    const ts = new Date(time).getTime();
    // Keep next 48 hours from now (include current hour)
    if (ts < now - 60 * 60 * 1000) continue;
    if (items.length >= 48) break;

    const code = h.weather_code?.[i] ?? 0;
    items.push({
      time,
      temperatureC: round1(h.temperature_2m[i] ?? 0),
      feelsLikeC: h.apparent_temperature
        ? round1(h.apparent_temperature[i] ?? 0)
        : undefined,
      humidityPercent: h.relative_humidity_2m
        ? Math.round(h.relative_humidity_2m[i] ?? 0)
        : undefined,
      windKph: h.wind_speed_10m
        ? Math.round(h.wind_speed_10m[i] ?? 0)
        : undefined,
      rainfallMm: round1(h.precipitation?.[i] ?? 0),
      precipitationProbabilityPercent: Math.round(
        h.precipitation_probability?.[i] ?? 0,
      ),
      condition: conditionFromWmoCode(code),
      conditionCode: code,
    });
  }

  return items;
}

function mapDaily(data: OpenMeteoForecastResponse): DailyForecastItem[] {
  const d = data.daily!;
  return d.time.map((date, i) => {
    const code = d.weather_code?.[i] ?? 0;
    return {
      date,
      highC: round1(d.temperature_2m_max?.[i] ?? 0),
      lowC: round1(d.temperature_2m_min?.[i] ?? 0),
      rainfallMm: round1(d.precipitation_sum?.[i] ?? 0),
      precipProbabilityMax: Math.round(
        d.precipitation_probability_max?.[i] ?? 0,
      ),
      windMaxKph: d.wind_speed_10m_max
        ? Math.round(d.wind_speed_10m_max[i] ?? 0)
        : undefined,
      condition: conditionFromWmoCode(code),
      conditionCode: code,
      sunrise: d.sunrise?.[i],
      sunset: d.sunset?.[i],
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

  const temps = hourly.slice(0, 24).map((h) => h.temperatureC);
  return {
    highC: temps.length ? Math.max(...temps) : current.temperatureC,
    lowC: temps.length ? Math.min(...temps) : current.temperatureC,
    rainfallMm: current.rainfallMm,
    precipProbabilityMax: current.precipitationProbabilityPercent,
  };
}
