import { Router } from "express";
import { z } from "zod";
import { db } from "../../config/db";
import { jwtAuth, requireAdmin } from "../../core/middleware/jwtAuth";
import { AppError } from "../../core/errors/AppError";
import { invalidateClientCache } from "../../utils/apiClient";

export const adminRoutes = Router();

// ทุก admin route ต้องเป็น admin
adminRoutes.use(jwtAuth, requireAdmin);

// list api clients
adminRoutes.get("/clients", async (_req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT id, name, api_key, is_active, created_at
       FROM api_clients
       ORDER BY id ASC`
    );
    res.json({ ok: true, data: rows });
  } catch (e) {
    next(e);
  }
});

const createClientSchema = z.object({
  name: z.string().min(2).max(100),
  api_key: z.string().min(8).max(255)
});

adminRoutes.post("/clients", async (req, res, next) => {
  try {
    const body = createClientSchema.parse(req.body);
    const { rows } = await db.query(
      `INSERT INTO api_clients(name, api_key, is_active, created_at)
       VALUES ($1,$2,TRUE,NOW())
       RETURNING id, name, api_key, is_active, created_at`,
      [body.name, body.api_key]
    );
    invalidateClientCache();
    res.json({ ok: true, data: rows[0] });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});

const setActiveSchema = z.object({ is_active: z.boolean() });

adminRoutes.patch("/clients/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) throw new AppError("Invalid id", 400, "BAD_REQUEST");
    const body = setActiveSchema.parse(req.body);

    const { rows } = await db.query(
      `UPDATE api_clients
       SET is_active = $2
       WHERE id = $1
       RETURNING id, name, api_key, is_active, created_at`,
      [id, body.is_active]
    );
    if (!rows[0]) throw new AppError("Client not found", 404, "CLIENT_NOT_FOUND");

    invalidateClientCache();
    res.json({ ok: true, data: rows[0] });
  } catch (e: any) {
    if (e?.name === "ZodError") return next(new AppError("Invalid body", 400, "BAD_REQUEST", e.errors));
    next(e);
  }
});
