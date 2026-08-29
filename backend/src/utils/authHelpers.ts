import type { AuthedRequest } from "../middleware/auth";
import { ApiError } from "./ApiError";

export function requireUserId(req: AuthedRequest): string {
  if (!req.userId) {
    throw new ApiError(401, "Authentication required");
  }
  return req.userId;
}

export function requireUserEmail(req: AuthedRequest): string {
  if (!req.userEmail) {
    throw new ApiError(401, "Authenticated email is required");
  }
  return req.userEmail.toLowerCase().trim();
}
