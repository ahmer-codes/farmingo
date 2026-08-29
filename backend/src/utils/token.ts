/**
 * @deprecated Legacy JWT helpers from pre–Firebase Auth. Unused, session auth uses Firebase ID tokens.
 * Safe to remove once confirmed no external consumers depend on these exports.
 */
import jwt from "jsonwebtoken";
import { env } from "../config";
import { ApiError } from "./ApiError";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
    ) as AccessTokenPayload;
    if (!decoded?.sub) throw new Error("Invalid token payload");
    return decoded;
  } catch {
    throw new ApiError(401, "Invalid or expired session");
  }
}
