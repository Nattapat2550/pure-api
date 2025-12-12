import { Router } from 'express';
import { jwtAuth, requireAdmin } from '../../core/middleware/jwtAuth';
import { listHomepageContent, upsertHomepageSection } from './homepage.service';

const router = Router();

// GET /api/homepage
router.get('/', async (_req, res, next) => {
  try {
    const rows = await listHomepageContent();
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// PUT /api/homepage
router.put('/', jwtAuth, requireAdmin, async (req, res, next) => {
  try {
    const { section_name, content } = req.body ?? {};
    if (!section_name) {
      return res.status(400).json({ error: 'Missing section_name' });
    }
    const row = await upsertHomepageSection(section_name, content ?? '');
    res.json(row);
  } catch (e) {
    next(e);
  }
});

export default router;
