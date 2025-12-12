import { Router } from 'express';
import multer from 'multer';
import { listCarouselItems } from './carousel.service';
import { jwtAuth, requireAdmin } from '../../core/middleware/jwtAuth';
import {
  createCarouselItem,
  updateCarouselItem,
  deleteCarouselItem
} from './carousel.service';

const router = Router();
const upload = multer({ limits: { fileSize: 4 * 1024 * 1024 } }); // 4MB

// GET /api/carousel (public)
router.get('/', async (_req, res, next) => {
  try {
    const rows = await listCarouselItems();
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// ส่วน admin ใช้ผ่าน /api/admin/carousel แทน (ดู admin.routes.ts)

export default router;
