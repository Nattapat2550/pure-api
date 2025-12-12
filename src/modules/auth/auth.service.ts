import crypto from 'crypto';
import { pool } from '../../config/db';
import { hashPassword, comparePassword } from '../../utils/password';
import { issueToken } from '../../core/middleware/jwtAuth';
import {
  CompleteProfilePayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  VerifyCodePayload
} from './auth.types';
import { AppError } from '../../core/errors/AppError';

function sixDigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashResetToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function registerByEmail(payload: RegisterPayload) {
  const email = payload.email.trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    throw new AppError('Invalid email', 400);
  }

  const { rows: existingRows } = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email]
  );
  const existing = existingRows[0];

  if (existing && existing.is_email_verified) {
    throw new AppError('Email already registered', 409);
  }

  const { rows: userRows } = await pool.query(
    `INSERT INTO users (email, is_email_verified)
     VALUES ($1, FALSE)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING *`,
    [email]
  );
  const user = userRows[0];

  const code = sixDigitCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `INSERT INTO verification_codes (user_id, code, expires_at)
     VALUES ($1,$2,$3)`,
    [user.id, code, expiresAt]
  );

  // TODO: ส่งอีเมลจริง (SMTP หรือ Gmail API)
  console.log(`[DEV] Verification code for ${email}: ${code}`);
}

export async function verifyCode(payload: VerifyCodePayload) {
  const email = payload.email.trim().toLowerCase();
  const code = payload.code.trim();

  const { rows: users } = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email]
  );
  const user = users[0];
  if (!user) throw AppError.notFound('User not found');

  const { rows: codes } = await pool.query(
    `SELECT * FROM verification_codes
     WHERE user_id=$1 AND code=$2 AND expires_at > NOW()
     ORDER BY id DESC LIMIT 1`,
    [user.id, code]
  );
  const row = codes[0];
  if (!row) {
    throw new AppError('Invalid or expired code', 400);
  }

  await pool.query(
    `UPDATE users SET is_email_verified=TRUE WHERE id=$1`,
    [user.id]
  );
  await pool.query(
    `DELETE FROM verification_codes WHERE user_id=$1`,
    [user.id]
  );
}

export async function completeProfile(payload: CompleteProfilePayload) {
  const email = payload.email.trim().toLowerCase();
  const username = payload.username.trim();

  if (!username) {
    throw new AppError('Username is required', 400);
  }
  if (payload.password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const { rows: users } = await pool.query(
    'SELECT * FROM users WHERE email=$1',
    [email]
  );
  const user = users[0];
  if (!user) throw AppError.notFound('User not found');

  if (!user.is_email_verified) {
    throw new AppError('Email is not verified', 400);
  }

  const passHash = await hashPassword(payload.password);

  try {
    const { rows: updatedRows } = await pool.query(
      `UPDATE users
       SET username=$2, password_hash=$3
       WHERE id=$1
       RETURNING *`,
      [user.id, username, passHash]
    );
    const updated = updatedRows[0];

    const token = issueToken(updated);
    return { token, user: updated };
  } catch (e: any) {
    if (e.code === '23505') {
      throw new AppError('Username already taken', 409);
    }
    throw e;
  }
}

export async function login(payload: LoginPayload) {
  const email = payload.email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [
    email
  ]);
  const user = rows[0];
  if (!user || !user.password_hash) {
    throw AppError.unauthorized('Invalid credentials');
  }

  const ok = await comparePassword(payload.password, user.password_hash);
  if (!ok) throw AppError.unauthorized('Invalid credentials');

  const token = issueToken(user);
  return { token, user };
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const email = payload.email.trim().toLowerCase();
  const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [
    email
  ]);
  const user = rows[0];
  if (!user) return; // ทำตัวเหมือนส่ง แต่ไม่บอกว่าไม่มี user

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await pool.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used)
     VALUES ($1,$2,$3,FALSE)`,
    [user.id, tokenHash, expiresAt]
  );

  // TODO: ส่งอีเมลจริง
  console.log(`[DEV] Reset password token for ${email}: ${rawToken}`);
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const rawToken = payload.token;
  if (!rawToken) throw new AppError('Missing token', 400);

  const tokenHash = hashResetToken(rawToken);

  const { rows } = await pool.query(
    `SELECT * FROM password_reset_tokens
     WHERE token=$1 AND is_used=FALSE AND expires_at > NOW()`,
    [tokenHash]
  );
  const row = rows[0];
  if (!row) {
    throw new AppError('Invalid or expired token', 400);
  }

  if (payload.password.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  const passHash = await hashPassword(payload.password);

  await pool.query('UPDATE users SET password_hash=$2 WHERE id=$1', [
    row.user_id,
    passHash
  ]);
  await pool.query(
    'UPDATE password_reset_tokens SET is_used=TRUE WHERE id=$1',
    [row.id]
  );
}
