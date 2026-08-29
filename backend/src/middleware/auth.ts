import type { NextFunction, Response } from "express";
import type { Request } from "express";
import { adminAuth } from "../config/firebase-admin";
import { ApiError } from "../utils/ApiError";
import { isUserAccountDisabled } from "../utils/userAccessCache";

export interface AuthedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  authToken?: string;
}

export async function requireAuth(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new ApiError(401, "Authentication required"));
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return next(new ApiError(401, "Authentication required"));
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (decoded.uid && (await isUserAccountDisabled(decoded.uid))) {
      return next(new ApiError(403, "This account has been disabled."));
    }
    req.authToken = token;
    req.userId = decoded.uid;
    req.userEmail = decoded.email;
    req.userRole = typeof decoded.role === "string" ? decoded.role : undefined;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired authentication token"));
  }
}
