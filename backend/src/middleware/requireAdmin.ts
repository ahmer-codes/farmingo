import type { NextFunction, Response } from "express";
import type { AuthedRequest } from "./auth";
import { ApiError } from "../utils/ApiError";
import { requireUserId } from "../utils/authHelpers";

export function requireAdmin(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction,
) {
  try {
    requireUserId(req);
    if (req.userRole !== "admin") {
      return next(new ApiError(403, "Admin access required"));
    }
    next();
  } catch (err) {
    next(err);
  }
}
