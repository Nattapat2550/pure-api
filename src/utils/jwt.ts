import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JwtPayload {
  id: number;
  role: 'user' | 'admin';
}

export function signToken(payload: JwtPayload): string {
  // ถ้าอยากใช้ JWT_EXPIRES_IN จาก env ก็เปลี่ยนเป็น process.env.JWT_EXPIRES_IN ได้
  return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
