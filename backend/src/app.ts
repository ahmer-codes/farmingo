import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env, isDev } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiRouter } from "./routes";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan(isDev ? "dev" : "combined"));

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      data: {
        name: "Farmingo API",
        version: "0.1.0",
        docs: "/api/health",
      },
    });
  });

  app.use("/api", apiRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
