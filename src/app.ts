import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { apiKeyAuth } from './core/middleware/apiKeyAuth';
import { errorHandler } from './core/middleware/errorHandler';
import { notFound } from './core/middleware/notFound';

import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/users.routes';
import adminRoutes from './modules/admin/admin.routes';
import homepageRoutes from './modules/homepage/homepage.routes';
import carouselRoutes from './modules/carousel/carousel.routes';
import downloadRoutes from './modules/download/download.routes';

export function createApp() {
  const app = express();

  // Security & performance
  app.use(helmet());
  app.use(compression());

  // Body & cookie
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '2mb' }));
  app.use(cookieParser());

  // CORS
  const allowedOrigins = env.frontendOrigins;
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true); // health check, curl ฯลฯ
        if (allowedOrigins.length === 0) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    })
  );

  // Health check
  app.get('/healthz', (_req, res) => res.json({ ok: true }));

  // Rate limit สำหรับ /api/auth
  const authLimiter = rateLimit({
    windowMs: 60_000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false
  });
  app.use('/api/auth', authLimiter);

  // API key middleware: ใช้กับ /api ทั้งหมดยกเว้น healthz
  app.use('/api', apiKeyAuth);

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/homepage', homepageRoutes);
  app.use('/api/carousel', carouselRoutes);
  app.use('/api/download', downloadRoutes);

  // 404 & error
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
