import express, { type Request, type Response } from "express";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { internalRoutes } from "./modules/internal/internal.routes";

import { env } from "./config/env";
import { apiKeyAuth } from "./core/middleware/apiKeyAuth";
import { errorHandler } from "./core/middleware/errorHandler";
import { notFound } from "./core/middleware/notFound";

import { authRoutes } from "./modules/auth/auth.routes";
import { usersRoutes } from "./modules/users/users.routes";
import { homepageRoutes } from "./modules/homepage/homepage.routes";
import { carouselRoutes } from "./modules/carousel/carousel.routes";
import { downloadRoutes } from "./modules/download/download.routes";
import { adminRoutes } from "./modules/admin/admin.routes";

export const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS: ปกติ pure-api ควรถูกเรียกจาก backend (server-to-server) อยู่แล้ว
const allowed = (env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (
      origin: string | undefined,
      cb: (err: Error | null, allow?: boolean) => void
    ) => {
      if (!origin) return cb(null, true);
      if (allowed.length === 0) return cb(null, false);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: false
  })
);

app.get("/health", (_req: Request, res: Response) => res.json({ ok: true }));

// จำกัด brute force เฉพาะ auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_AUTH_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

// บังคับทุก /api ต้องมี x-api-key (backend เท่านั้นที่ถือ key)
app.use("/api", apiKeyAuth);

// routes
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/homepage", homepageRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/api/download", downloadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/internal", internalRoutes);

app.use(notFound);
app.use(errorHandler);
