import { Router } from "express";
import { z } from "zod";
import { jwtAuth } from "../../core/middleware/jwtAuth";
import { AppError } from "../../core/errors/AppError";
import * as service from "./users.service";

export const usersRoutes = Router();

const updateSchema = z.object({
  username: z.string().min(2).max(50).optional(),
  profile_picture_url: z.string().min(1).max(2000).optional()
});

usersRoutes.get("/me", jwtAuth, async (req, res, next) => {
  try {
    const u = await service.getById(req.user!.id);
    res.json({ ok: true, data: u });
  } catch (e) {
    next(e);
  }
});

usersRoutes.patch("/me", jwtAuth, async (req, res, next) => {
  try {
    const body = updateSchema.parse(req.body);
    const u = await service.updateMe(req.user!.id, body);
    res.json({ ok: true, data: u });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});
