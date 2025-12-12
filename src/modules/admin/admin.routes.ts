import { Router } from 'express';
import multer from 'multer';
import { pool } from '../../config/db';
import { jwtAuth, requireAdmin } from '../../core/middleware/jwtAuth';
import {
  createCarouselItem,
  deleteCarouselItem,
  listCarouselItems,
  updateCarouselItem
} from '../carousel/carousel.service';

const router = Router();
const upload = multer({ limits: { fileSize: 4 * 1024 * 1024 } });

// GET /api/admin/users
router.get('/users', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, username, email, role, profile_picture_url, is_email_verified,
              created_at, updated_at
       FROM users
       ORDER BY id ASC`
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// PUT /api/admin/users/:id
router.put('/users/:id', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const { username, email, role, profile_picture_url } = req.body ?? {};
    const { rows } = await pool.query(
      `UPDATE users SET
         username = COALESCE($2, username),
         email = COALESCE($3, email),
         role = COALESCE($4, role),
         profile_picture_url = COALESCE($5, profile_picture_url)
       WHERE id=$1
       RETURNING id, username, email, role, profile_picture_url, is_email_verified,
                 created_at, updated_at`,
      [id, username ?? null, email ?? null, role ?? null, profile_picture_url ?? null]
    );
    const row = rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
});

// ---- Carousel (admin) ----

// GET /api/admin/carousel
router.get('/carousel', jwtAuth, requireAdmin, async (_req, res, next) => {
  try {
    const items = await listCarouselItems();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// POST /api/admin/carousel
router.post(
  '/carousel',
  jwtAuth,
  requireAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const { item_index, title, subtitle, description } = req.body ?? {};
      if (!req.file) {
        return res.status(400).json({ error: 'Missing image' });
      }
      const mime = req.file.mimetype;
      if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      const dataUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;

      const created = await createCarouselItem({
        item_index: Number(item_index ?? 0),
        title,
        subtitle,
        description,
        image_dataurl: dataUrl
      });
      res.status(201).json(created);
    } catch (e) {
      next(e);
    }
  }
);

// PUT /api/admin/carousel/:id
router.put(
  '/carousel/:id',
  jwtAuth,
  requireAdmin,
  upload.single('image'),
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { item_index, title, subtitle, description } = req.body ?? {};
      let image_dataurl: string | undefined;
      if (req.file) {
        const mime = req.file.mimetype;
        if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
          return res.status(400).json({ error: 'Unsupported file type' });
        }
        image_dataurl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
      }

      const updated = await updateCarouselItem(id, {
        item_index: item_index !== undefined ? Number(item_index) : undefined,
        title,
        subtitle,
        description,
        image_dataurl
      });
      if (!updated) return res.status(404).json({ error: 'Not found' });
      res.json(updated);
    } catch (e) {
      next(e);
    }
  }
);

// DELETE /api/admin/carousel/:id
router.delete(
  '/carousel/:id',
  jwtAuth,
  requireAdmin,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      await deleteCarouselItem(id);
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  }
);

export default router;
