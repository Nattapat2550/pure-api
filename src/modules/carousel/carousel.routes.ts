import { Router } from "express";
import { z } from "zod";
import { AppError } from "../../core/errors/AppError";
import { jwtAuth, requireAdmin } from "../../core/middleware/jwtAuth";
import * as service from "./carousel.service";

export const carouselRoutes = Router();

carouselRoutes.get("/", async (_req, res, next) => {
  try {
    const items = await service.listCarousel();
    res.json({ ok: true, data: items });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  item_index: z.number().int().optional(),
  title: z.string().max(255).optional(),
  subtitle: z.string().max(255).optional(),
  description: z.string().max(50000).optional(),
  image_dataurl: z.string().min(10)
});

carouselRoutes.post("/", jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const body = createSchema.parse(req.body);
    const out = await service.createItem(body);
    res.json({ ok: true, data: out });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});

const updateSchema = z.object({
  item_index: z.number().int().optional(),
  title: z.string().max(255).optional(),
  subtitle: z.string().max(255).optional(),
  description: z.string().max(50000).optional(),
  image_dataurl: z.string().min(10).optional()
});

carouselRoutes.put("/:id", jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError("Invalid id", 400, "BAD_REQUEST");
    const body = updateSchema.parse(req.body);
    const out = await service.updateItem(id, body);
    res.json({ ok: true, data: out });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});

carouselRoutes.delete("/:id", jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError("Invalid id", 400, "BAD_REQUEST");
    await service.deleteItem(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});
