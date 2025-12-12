import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5000),

  DATABASE_URL: z.string().min(10),
  DB_SSL: z.coerce.boolean().default(true),

  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("30d"),

  DOWNLOAD_WINDOWS_PATH: z.string().default("./app/MyAppSetup.exe"),
  DOWNLOAD_ANDROID_PATH: z.string().default("./app/app-release.apk"),

  LOG_LEVEL: z.string().default("info"),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(30),
  ALLOWED_ORIGINS: z.string().optional()
});

export const env = schema.parse(process.env);
