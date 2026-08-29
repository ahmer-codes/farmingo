import { userRepository } from "../repositories";

const TTL_MS = 60_000;

interface CacheEntry {
  disabled: boolean;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

export function invalidateUserAccessCache(userId: string) {
  cache.delete(userId);
}

export async function isUserAccountDisabled(userId: string): Promise<boolean> {
  const cached = cache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.disabled;
  }

  const user = await userRepository.findById(userId);
  const disabled = user?.status === "disabled";
  cache.set(userId, { disabled, expiresAt: Date.now() + TTL_MS });
  return disabled;
}

export function effectiveUserStatus(
  user: { status?: "active" | "disabled" } | null | undefined,
): "active" | "disabled" {
  return user?.status === "disabled" ? "disabled" : "active";
}
