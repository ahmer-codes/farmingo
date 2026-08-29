import {
  farmRepository,
  cropRepository,
  fieldRepository,
} from "../../repositories";
import { ApiError } from "../../utils/ApiError";
import { WeatherCache, WeatherRateLimiter } from "./cache";
import { buildCropContexts, buildCropContextsFromRecords } from "./cropContext";
import { weatherIntelligenceService } from "./intelligence.service";
import { getCachedGeocode, setCachedGeocode } from "./geocodeCache";
import { OpenMeteoGeocodeProvider } from "./openMeteoGeocode";
import { createWeatherProvider } from "./providerFactory";
import type {
  CropContext,
  GeoCoordinates,
  WeatherBundle,
  WeatherMeta,
  WeatherRecommendation,
  WeatherRisk,
} from "./types";

const cache = new WeatherCache(15 * 60 * 1000);
/** Max 30 upstream-triggering requests per user per 10 minutes */
const rateLimiter = new WeatherRateLimiter(30, 10 * 60 * 1000);
const geocoder = new OpenMeteoGeocodeProvider();
const provider = createWeatherProvider();

/** Geocoding must resolve reliably or return 422, no hardcoded city fallbacks. */

export interface WeatherCurrentResponse {
  location: GeoCoordinates & { farmLocation: string; farmName: string };
  current: WeatherBundle["current"];
  today: WeatherBundle["today"];
  hourlyPreview: WeatherBundle["hourly"];
  recommendations: WeatherRecommendation[];
  risks: WeatherRisk[];
  cropContexts: CropContext[];
  meta: WeatherMeta;
}

export interface WeatherForecastResponse {
  location: GeoCoordinates & { farmLocation: string; farmName: string };
  hourly: WeatherBundle["hourly"];
  daily: WeatherBundle["daily"];
  recommendations: WeatherRecommendation[];
  risks: WeatherRisk[];
  cropContexts: CropContext[];
  meta: WeatherMeta;
}

function buildFarmQuery(location: string, region?: string): string {
  const parts = [location, region].filter(Boolean);
  return parts.join(", ");
}

async function resolveCoordinates(
  location: string,
  region?: string,
): Promise<GeoCoordinates> {
  const query = buildFarmQuery(location, region);
  const cityHint = location.includes(",")
    ? location
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .at(-1)
    : undefined;

  const attempts = [
    query,
    location,
    cityHint,
    region ? `${cityHint || location}, ${region}` : undefined,
  ].filter((v, i, arr): v is string => Boolean(v) && arr.indexOf(v) === i);

  for (const attempt of attempts) {
    const cached = getCachedGeocode(attempt);
    if (cached) {
      return {
        ...cached,
        label: cached.label || location,
        region: cached.region || region,
      };
    }

    const result = await geocoder.geocode(attempt);
    if (result) {
      setCachedGeocode(attempt, result);
      return {
        ...result,
        label: result.label || location,
        region: result.region || region,
      };
    }
  }

  throw new ApiError(
    422,
    `Could not resolve farm location "${query}". Update your farm location in Profile.`,
  );
}

async function loadBundle(
  userId: string,
  coords: GeoCoordinates,
): Promise<{ bundle: WeatherBundle; meta: WeatherMeta }> {
  const cacheKey = cache.key(coords.latitude, coords.longitude, provider.name);
  const cached = cache.get(cacheKey);

  if (cached && !cached.expired) {
    return {
      bundle: cached.bundle,
      meta: {
        provider: cached.bundle.provider,
        fetchedAt: cached.bundle.fetchedAt,
        expiresAt: new Date(
          new Date(cached.bundle.fetchedAt).getTime() + cache.ttlMsValue(),
        ).toISOString(),
        stale: false,
        cacheHit: true,
      },
    };
  }

  const retryAfter = rateLimiter.check(userId);
  if (retryAfter !== null) {
    if (cached) {
      return {
        bundle: cached.bundle,
        meta: {
          provider: cached.bundle.provider,
          fetchedAt: cached.bundle.fetchedAt,
          expiresAt: new Date(
            new Date(cached.bundle.fetchedAt).getTime() + cache.ttlMsValue(),
          ).toISOString(),
          stale: true,
          cacheHit: true,
          rateLimited: true,
        },
      };
    }
    throw new ApiError(
      429,
      `Weather rate limit reached. Retry in ${retryAfter}s.`,
    );
  }

  try {
    const bundle = await provider.fetchWeather(coords);
    cache.set(cacheKey, bundle);
    return {
      bundle,
      meta: {
        provider: bundle.provider,
        fetchedAt: bundle.fetchedAt,
        expiresAt: new Date(
          new Date(bundle.fetchedAt).getTime() + cache.ttlMsValue(),
        ).toISOString(),
        stale: false,
        cacheHit: false,
      },
    };
  } catch (err) {
    if (cached) {
      return {
        bundle: cached.bundle,
        meta: {
          provider: cached.bundle.provider,
          fetchedAt: cached.bundle.fetchedAt,
          expiresAt: new Date(
            new Date(cached.bundle.fetchedAt).getTime() + cache.ttlMsValue(),
          ).toISOString(),
          stale: true,
          cacheHit: true,
          rateLimited: err instanceof ApiError && err.statusCode === 429,
        },
      };
    }
    throw err;
  }
}

async function loadCropContexts(
  userId: string,
  primaryCrops: string[],
): Promise<CropContext[]> {
  const [cropRecords, fields] = await Promise.all([
    cropRepository.listByUser(userId),
    fieldRepository.listByUser(userId),
  ]);
  const fieldNames = new Map(fields.map((f) => [f.id, f.name]));
  const fromRecords = buildCropContextsFromRecords(cropRecords, fieldNames);
  if (fromRecords.length) return fromRecords;
  return buildCropContexts(primaryCrops);
}

export const weatherService = {
  async getCurrent(userId: string): Promise<WeatherCurrentResponse> {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) {
      throw new ApiError(
        404,
        "No farm profile found. Complete farm setup first.",
      );
    }
    if (!farm.location?.trim()) {
      throw new ApiError(
        422,
        "Farm location is not set. Add a location in Profile to view weather.",
      );
    }

    const coords = await resolveCoordinates(farm.location, farm.region);
    const { bundle, meta } = await loadBundle(userId, coords);
    const cropContexts = await loadCropContexts(userId, farm.primaryCrops);
    const intelligence = weatherIntelligenceService.analyze(
      bundle,
      cropContexts,
    );

    return {
      location: {
        ...bundle.location,
        farmLocation: farm.location,
        farmName: farm.name,
        region: bundle.location.region || farm.region,
      },
      current: bundle.current,
      today: bundle.today,
      hourlyPreview: bundle.hourly.slice(0, 8),
      recommendations: intelligence.recommendations,
      risks: intelligence.risks,
      cropContexts: intelligence.cropContexts,
      meta,
    };
  },

  async getForecast(userId: string): Promise<WeatherForecastResponse> {
    const farm = await farmRepository.findByOwnerId(userId);
    if (!farm) {
      throw new ApiError(
        404,
        "No farm profile found. Complete farm setup first.",
      );
    }
    if (!farm.location?.trim()) {
      throw new ApiError(
        422,
        "Farm location is not set. Add a location in Profile to view weather.",
      );
    }

    const coords = await resolveCoordinates(farm.location, farm.region);
    const { bundle, meta } = await loadBundle(userId, coords);
    const cropContexts = await loadCropContexts(userId, farm.primaryCrops);
    const intelligence = weatherIntelligenceService.analyze(
      bundle,
      cropContexts,
    );

    return {
      location: {
        ...bundle.location,
        farmLocation: farm.location,
        farmName: farm.name,
        region: bundle.location.region || farm.region,
      },
      hourly: bundle.hourly,
      daily: bundle.daily,
      recommendations: intelligence.recommendations,
      risks: intelligence.risks,
      cropContexts: intelligence.cropContexts,
      meta,
    };
  },
};
