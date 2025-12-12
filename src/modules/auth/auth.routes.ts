import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../core/errors/AppError";
import { jwtAuth } from "../../core/middleware/jwtAuth";
import * as service from "./auth.service";

export const authRoutes = Router();

const registerSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  email: z.string().email(),
  password: z.string().min(6).max(200)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200)
});

authRoutes.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const out = await service.register(body);
    res.json({ ok: true, data: out });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const out = await service.login(body);
    res.json({ ok: true, data: out });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});

authRoutes.get("/me", jwtAuth, async (req, res, next) => {
  try {
    const u = await service.getMe(req.user!.id);
    res.json({ ok: true, data: u });
  } catch (e) {
    next(e);
  }
});
