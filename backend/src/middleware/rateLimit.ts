import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  keyPrefix: string;
}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const userId = (req as { userId?: string }).userId;
    if (!userId) return next();

    const key = `${options.keyPrefix}:${userId}`;
    const now = Date.now();
    const entry = buckets.get(key);

    if (!entry || now >= entry.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    if (entry.count >= options.max) {
      return next(
        new ApiError(
          429,
          "Too many requests. Please wait before sending another message.",
        ),
      );
    }

    entry.count += 1;
    next();
  };
}

export const supportMessageRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 20,
  keyPrefix: "support-msg",
});

export const adminMessageRateLimit = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  keyPrefix: "admin-msg",
});
