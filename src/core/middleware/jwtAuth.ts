import { Request, RequestHandler, Response } from 'express';
import { verifyToken, JwtPayload, signToken } from '../../utils/jwt';
import { AppError } from '../errors/AppError';

export interface AuthUser {
  id: number;
  role: 'user' | 'admin';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

/** เขียน cookie JWT */
export function setAuthCookie(res: Response, token: string, remember: boolean) {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',  // <- แก้เป็น none ตัวเล็กแล้ว
    maxAge: remember
      ? 1000 * 60 * 60 * 24 * 30
      : 1000 * 60 * 60 * 24
  });
}

/** ลบ cookie */
export function clearAuthCookie(res: Response) {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',   // <- แก้เป็น none ตัวเล็กแล้ว
    expires: new Date(0),
  });
}

/** ดึง token จาก cookie หรือ header */
function extractToken(req: Request): string | null {
  const cookieToken = (req as any).cookies?.token;
  const header = req.headers['authorization']; // ตอนนี้ headers เป็นของ express แล้ว มี index signature
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return cookieToken ?? null;
}

/** Require login */
export const jwtAuth: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);  // ตอนนี้ type ตรง ไม่เอา DOM Request แล้ว
  if (!token) {
    return next(AppError.unauthorized());
  }
  try {
    const payload = verifyToken(token);
    (req as any).user = { id: payload.id, role: payload.role };
    next();
  } catch {
    next(AppError.unauthorized('Invalid token'));
  }
};

/** ใช้เช็กสถานะ (ไม่ล็อกอินก็ได้) */
export const jwtOptional: RequestHandler = (req, _res, next) => {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = verifyToken(token);
      (req as any).user = { id: payload.id, role: payload.role };
    } catch {
      // ignore
    }
  }
  next();
};

/** ต้องเป็น admin */
export const requireAdmin: RequestHandler = (req, _res, next) => {
  const user = (req as any).user as AuthUser | undefined;
  if (!user || user.role !== 'admin') {
    return next(AppError.forbidden());
  }
  next();
};

// helper เผื่ออยาก reuse
export function issueToken(user: { id: number; role: 'user' | 'admin' }) {
  return signToken({ id: user.id, role: user.role });
}
