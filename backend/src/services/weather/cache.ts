import type { WeatherBundle } from "./types";

interface CacheEntry {
  bundle: WeatherBundle;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 15 * 60 * 1000;

export class WeatherCache {
  private readonly store = new Map<string, CacheEntry>();

  constructor(private readonly ttlMs = DEFAULT_TTL_MS) {}

  key(lat: number, lon: number, provider: string): string {
    return `${provider}:${lat.toFixed(3)},${lon.toFixed(3)}`;
  }

  get(key: string): { bundle: WeatherBundle; expired: boolean } | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    return {
      bundle: entry.bundle,
      expired: Date.now() > entry.expiresAt,
    };
  }

  set(key: string, bundle: WeatherBundle): void {
    this.store.set(key, {
      bundle,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  ttlMsValue(): number {
    return this.ttlMs;
  }
}

/** Simple per-user request gate to avoid hammering upstream providers. */
export class WeatherRateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowMs: number,
  ) {}

  /** Returns retry-after seconds when limited, otherwise null. */
  check(userId: string): number | null {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const recent = (this.hits.get(userId) || []).filter(
      (t) => t >= windowStart,
    );

    if (recent.length >= this.maxRequests) {
      const oldest = recent[0]!;
      return Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
    }

    recent.push(now);
    this.hits.set(userId, recent);
    return null;
  }
}
