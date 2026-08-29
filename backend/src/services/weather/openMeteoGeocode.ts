import { ApiError } from "../../utils/ApiError";
import type { GeocodeProvider, GeoCoordinates } from "./types";

interface OpenMeteoGeocodeResult {
  results?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    country?: string;
    admin1?: string;
    timezone?: string;
  }>;
}

/**
 * Open-Meteo geocoding, no API key required.
 * https://open-meteo.com/en/docs/geocoding-api
 */
export class OpenMeteoGeocodeProvider implements GeocodeProvider {
  constructor(
    private readonly baseUrl = "https://geocoding-api.open-meteo.com/v1",
  ) {}

  async geocode(query: string): Promise<GeoCoordinates | null> {
    const trimmed = query.trim();
    if (!trimmed) return null;

    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        return await this.fetchGeocode(trimmed);
      } catch (err) {
        lastError = err;
        if (attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  private async fetchGeocode(trimmed: string): Promise<GeoCoordinates | null> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set("name", trimmed);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    let response: Response;
    try {
      response = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
      });
    } catch {
      throw new ApiError(502, "Unable to reach geocoding service");
    }

    if (response.status === 429) {
      throw new ApiError(
        429,
        "Geocoding rate limit reached. Try again shortly.",
      );
    }

    if (!response.ok) {
      throw new ApiError(502, "Geocoding service returned an error");
    }

    const data = (await response.json()) as OpenMeteoGeocodeResult;
    const hit = data.results?.[0];
    if (!hit) return null;

    return {
      latitude: hit.latitude,
      longitude: hit.longitude,
      label: hit.name,
      region: hit.admin1,
      country: hit.country,
      timezone: hit.timezone,
    };
  }
}
