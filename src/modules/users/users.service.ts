import { pool } from '../../config/db';
import { UpdateProfilePayload } from './users.types';
import { AppError } from '../../core/errors/AppError';

export async function getUserById(id: number) {
  const { rows } = await pool.query(
    `SELECT id, username, email, role, profile_picture_url, is_email_verified
     FROM users WHERE id=$1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function updateProfile(
  userId: number,
  payload: UpdateProfilePayload
) {
  const { username, profile_picture_url } = payload;

  const { rows } = await pool.query(
    `UPDATE users SET
       username = COALESCE($2, username),
       profile_picture_url = COALESCE($3, profile_picture_url)
     WHERE id=$1
     RETURNING id, username, email, role, profile_picture_url, is_email_verified`,
    [userId, username ?? null, profile_picture_url ?? null]
  );
  const row = rows[0];
  if (!row) throw AppError.notFound('User not found');
  return row;
}

export async function deleteUser(userId: number) {
  await pool.query('DELETE FROM users WHERE id=$1', [userId]);
}
