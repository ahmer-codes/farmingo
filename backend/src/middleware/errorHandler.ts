import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { isDev } from "../config";

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new ApiError(404, "Route not found"));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const message = err instanceof Error ? err.message : "Internal server error";
  const errors = err instanceof ApiError ? err.errors : undefined;

  if (isDev && status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}
