import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../core/errors/AppError";
import { jwtAuth, requireAdmin } from "../../core/middleware/jwtAuth";
import * as service from "./homepage.service";

export const homepageRoutes = Router();

homepageRoutes.get("/:section", async (req, res, next) => {
  try {
    const out = await service.getSection(req.params.section);
    res.json({ ok: true, data: out });
  } catch (e) {
    next(e);
  }
});

const upsertSchema = z.object({ content: z.string().min(1).max(50000) });

homepageRoutes.put("/:section", jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = upsertSchema.parse(req.body);
    const out = await service.upsertSection(req.params.section, body.content);
    res.json({ ok: true, data: out });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});
