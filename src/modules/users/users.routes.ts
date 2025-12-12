import { Router } from 'express';
import multer from 'multer';
import { jwtAuth } from '../../core/middleware/jwtAuth';
import { deleteUser, getUserById, updateProfile } from './users.service';
import { UpdateProfilePayload } from './users.types';

const router = Router();
const upload = multer({ limits: { fileSize: 2 * 1024 * 1024 } }); // 2MB

// GET /api/users/me
router.get('/me', jwtAuth, async (req, res, next) => {
  try {
    const user = await getUserById((req as any).user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (e) {
    next(e);
  }
});

// PUT /api/users/me
router.put('/me', jwtAuth, async (req, res, next) => {
  try {
    const updated = await updateProfile(
      (req as any).user.id,
      req.body as UpdateProfilePayload
    );
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

// DELETE /api/users/me
router.delete('/me', jwtAuth, async (req, res, next) => {
  try {
    await deleteUser((req as any).user.id);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

// POST /api/users/me/avatar (multipart form-data)
router.post(
  '/me/avatar',
  jwtAuth,
  upload.single('avatar'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Missing avatar file' });
      }
      const mime = req.file.mimetype;
      if (!/^image\/(png|jpe?g|gif|webp)$/.test(mime)) {
        return res.status(400).json({ error: 'Unsupported file type' });
      }
      const b64 = req.file.buffer.toString('base64');
      const dataUrl = `data:${mime};base64,${b64}`;

      const updated = await updateProfile((req as any).user.id, {
        profile_picture_url: dataUrl
      });
      res.json({
        ok: true,
        profile_picture_url: updated.profile_picture_url
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
