import type { Request, Response } from "express";
import { env } from "../config";

export const healthController = {
  check(_req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        status: "ok",
        service: "farmingo-api",
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      },
    });
  },
};
