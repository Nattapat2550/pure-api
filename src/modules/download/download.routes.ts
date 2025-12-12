import { Router } from 'express';
import { downloadAndroid, downloadWindows } from './download.service';

const router = Router();

// GET /api/download/windows
router.get('/windows', (_req, res) => {
  downloadWindows(res);
});

// GET /api/download/android
router.get('/android', (_req, res) => {
  downloadAndroid(res);
});

export default router;
