import { Router } from 'express';
import { setAuthCookie, clearAuthCookie, jwtOptional } from '../../core/middleware/jwtAuth';
import {
  completeProfile,
  forgotPassword,
  login,
  registerByEmail,
  resetPassword,
  verifyCode
} from './auth.service';
import {
  CompleteProfilePayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyCodePayload
} from './auth.types';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    await registerByEmail(req.body as RegisterPayload);
    res.status(201).json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/verify-code
router.post('/verify-code', async (req, res, next) => {
  try {
    await verifyCode(req.body as VerifyCodePayload);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/complete-profile
router.post('/complete-profile', async (req, res, next) => {
  try {
    const { token, user } = await completeProfile(
      req.body as CompleteProfilePayload
    );
    setAuthCookie(res, token, true);
    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const payload = req.body as LoginPayload;
    const remember = !!payload.remember;
    const { token, user } = await login(payload);
    setAuthCookie(res, token, remember);
    res.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile_picture_url: user.profile_picture_url
      }
    });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    await forgotPassword(req.body as ForgotPasswordPayload);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    await resetPassword(req.body as ResetPasswordPayload);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// GET /api/auth/status
router.get('/status', jwtOptional, (req, res) => {
  const u = (req as any).user;
  if (!u) return res.json({ authenticated: false });
  res.json({ authenticated: true, user: u });
});

export default router;
