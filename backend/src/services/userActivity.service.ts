import { FieldValue } from "firebase-admin/firestore";
import { adminAuth } from "../config/firebase-admin";
import type { UserRecord, UserStatus } from "../models/user";
import { userRepository } from "../repositories";
import { ApiError } from "../utils/ApiError";
import { invalidateUserAccessCache } from "../utils/userAccessCache";
import { nowIso } from "../utils/firestore";

const LOGIN_THROTTLE_MS = 30 * 60 * 1000;
const ACTIVITY_THROTTLE_MS = 4 * 60 * 1000;

function isStale(iso: string | undefined, throttleMs: number): boolean {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() >= throttleMs;
}

async function ensureDefaultStatus(userId: string, user: UserRecord) {
  if (user.status) return user;
  await userRepository.update(userId, { status: "active" });
  return { ...user, status: "active" as const };
}

export const userActivityService = {
  /** Called once when a browser session begins, throttled server-side as a safety net. */
  async recordSessionStart(userId: string) {
    let user = await userRepository.findById(userId);
    if (!user)
      throw new ApiError(
        404,
        "User profile not found. Complete registration bootstrap.",
      );
    if (user.status === "disabled")
      throw new ApiError(403, "This account has been disabled.");

    user = await ensureDefaultStatus(userId, user);

    const now = nowIso();
    const patch: Partial<UserRecord> = {};

    if (isStale(user.lastLoginAt, LOGIN_THROTTLE_MS)) {
      patch.lastLoginAt = now;
    }
    if (isStale(user.lastActiveAt, ACTIVITY_THROTTLE_MS)) {
      patch.lastActiveAt = now;
    }

    if (Object.keys(patch).length) {
      await userRepository.update(userId, patch);
    }
  },

  /** Throttled heartbeat, ignores calls within ACTIVITY_THROTTLE_MS. */
  async recordActivity(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user || user.status === "disabled") return;
    if (!isStale(user.lastActiveAt, ACTIVITY_THROTTLE_MS)) return;
    await userRepository.update(userId, { lastActiveAt: nowIso() });
  },

  async setAccountStatus(uid: string, status: UserStatus) {
    const authUser = await adminAuth.getUser(uid);
    const claims = authUser.customClaims || {};
    if (claims.role === "admin") {
      throw new ApiError(
        403,
        "Admin accounts cannot be disabled through this endpoint.",
      );
    }

    const user = await userRepository.findById(uid);
    if (!user) throw new ApiError(404, "User not found");

    if (status === "disabled") {
      await adminAuth.updateUser(uid, { disabled: true });
      await userRepository.update(uid, {
        status: "disabled",
        disabledAt: nowIso(),
      });
    } else {
      await adminAuth.updateUser(uid, { disabled: false });
      await userRepository.updateFields(uid, {
        status: "active",
        disabledAt: FieldValue.delete(),
      });
    }

    invalidateUserAccessCache(uid);
    const updated = await userRepository.findById(uid);
    if (!updated) throw new ApiError(404, "User not found");
    return updated;
  },
};
