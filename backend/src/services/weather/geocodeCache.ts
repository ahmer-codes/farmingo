import type { GeoCoordinates } from "./types";

interface CacheEntry {
  coords: GeoCoordinates;
  expiresAt: number;
}

const TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

function normalizeKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getCachedGeocode(query: string): GeoCoordinates | null {
  const key = normalizeKey(query);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.coords;
}

export function setCachedGeocode(query: string, coords: GeoCoordinates) {
  cache.set(normalizeKey(query), {
    coords,
    expiresAt: Date.now() + TTL_MS,
  });
}
