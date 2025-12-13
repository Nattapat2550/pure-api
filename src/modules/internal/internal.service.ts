import { db } from "../../config/db";
import { AppError } from "../../core/errors/AppError";
import { hashPassword } from "../../utils/password";
import * as crypto from "crypto";

// Helper สำหรับ Hash Token (เหมือนใน projectdocker เดิม)
function hashToken(raw: string) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function findUserByEmail(email: string) {
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1', [email]);
  return rows[0] || null;
}

export async function findUserById(id: number) {
  const { rows } = await db.query('SELECT * FROM users WHERE id=$1', [id]);
  return rows[0] || null;
}

export async function findUserByOAuth(provider: string, oauthId: string) {
  const { rows } = await db.query('SELECT * FROM users WHERE oauth_provider=$1 AND oauth_id=$2', [provider, oauthId]);
  return rows[0] || null;
}

export async function createUserByEmail(email: string) {
  const { rows } = await db.query(
    `INSERT INTO users (email, is_email_verified)
     VALUES ($1, FALSE)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING *`,
    [email]
  );
  return rows[0];
}

export async function storeVerificationCode(userId: number, code: string, expiresAt: string) {
  await db.query('DELETE FROM verification_codes WHERE user_id=$1', [userId]);
  const { rows } = await db.query(
    `INSERT INTO verification_codes (user_id, code, expires_at) VALUES ($1,$2,$3) RETURNING *`,
    [userId, code, expiresAt]
  );
  return rows[0];
}

export async function validateAndConsumeCode(email: string, code: string) {
  const user = await findUserByEmail(email);
  if (!user) return { ok: false, reason: 'no_user' };
  
  const { rows } = await db.query(
    `SELECT * FROM verification_codes WHERE user_id=$1 AND code=$2 AND expires_at > NOW()`,
    [user.id, code]
  );
  const rec = rows[0];
  if (!rec) return { ok: false, reason: 'invalid_or_expired' };
  
  await db.query('DELETE FROM verification_codes WHERE id=$1', [rec.id]);
  await db.query('UPDATE users SET is_email_verified=TRUE WHERE id=$1', [user.id]);
  
  return { ok: true, userId: user.id };
}

export async function setUsernameAndPassword(email: string, username: string, password: string) {
  // Pure-API ทำหน้าที่ Hash Password ให้เลยเพื่อความปลอดภัย
  const hash = await hashPassword(password);
  const { rows } = await db.query(
    `UPDATE users SET username=$2, password_hash=$3 WHERE email=$1 AND is_email_verified=TRUE RETURNING *`,
    [email, username, hash]
  );
  return rows[0] || null;
}

export async function setOAuthUser(data: any) {
  const { email, provider, oauthId, pictureUrl } = data;
  const existingByOAuth = await findUserByOAuth(provider, oauthId);
  if (existingByOAuth) return existingByOAuth;

  const existingByEmail = await findUserByEmail(email);
  if (existingByEmail) {
    const { rows } = await db.query(
      `UPDATE users SET
         oauth_provider=$2, oauth_id=$3, is_email_verified=TRUE,
         profile_picture_url=COALESCE($4, profile_picture_url),
         username = COALESCE(username, split_part($5,'@',1))
       WHERE email=$1
       RETURNING *`,
      [email, provider, oauthId, pictureUrl || null, email]
    );
    return rows[0];
  }

  const { rows } = await db.query(
    `INSERT INTO users (email, oauth_provider, oauth_id, is_email_verified, profile_picture_url, username)
     VALUES ($1,$2,$3,TRUE,$4, split_part($5,'@',1))
     RETURNING *`,
    [email, provider, oauthId, pictureUrl || null, email]
  );
  return rows[0];
}

export async function createPasswordResetToken(email: string, rawToken: string, expiresAt: string) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  const tokenHash = hashToken(rawToken);
  await db.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, is_used) VALUES ($1,$2,$3,FALSE)`,
    [user.id, tokenHash, expiresAt]
  );
  return user;
}

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await db.query(
    `SELECT * FROM password_reset_tokens WHERE token=$1 AND is_used=FALSE AND expires_at > NOW()`,
    [tokenHash]
  );
  const rec = rows[0];
  if (!rec) return null;
  
  await db.query('UPDATE password_reset_tokens SET is_used=TRUE WHERE id=$1', [rec.id]);
  const user = await findUserById(rec.user_id);
  return user;
}

export async function setPassword(userId: number, newPassword: string) {
  const hash = await hashPassword(newPassword);
  const { rows } = await db.query('UPDATE users SET password_hash=$2 WHERE id=$1 RETURNING *', [userId, hash]);
  return rows[0];
}