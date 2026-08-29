import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  DATABASE_URL: z.string().default(""),
  WEATHER_API_KEY: z.string().optional().default(""),
  WEATHER_API_BASE_URL: z
    .string()
    .default("https://api.openweathermap.org/data/2.5"),
  NOTIFICATION_PROVIDER: z.string().default("mock"),
  NOTIFICATION_API_KEY: z.string().optional().default(""),
  NOTIFICATION_TIMEZONE: z.string().default("Asia/Karachi"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string().min(1),
  /** Legacy JWT settings, kept for backward compatibility during migration. */
  JWT_ACCESS_SECRET: z.string().min(8).default("legacy-jwt-unused-change-me"),
  JWT_REFRESH_SECRET: z.string().min(8).default("legacy-jwt-unused-change-me"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("1d"),
  ADMIN_BOOTSTRAP_EMAILS: z.string().optional().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Invalid environment configuration:",
    parsed.error.flatten().fieldErrors,
  );
  process.exit(1);
}

export const env = parsed.data;

export const isDev = env.NODE_ENV === "development";
