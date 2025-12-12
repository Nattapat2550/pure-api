import { db } from "../../config/db";
import { AppError } from "../../core/errors/AppError";
import { UpdateUserBody } from "./users.types";

type UserRow = {
  id: number;
  username: string | null;
  email: string;
  role: "user" | "admin";
  profile_picture_url: string | null;
  is_email_verified: boolean;
};

export async function getById(id: number) {
  const { rows } = await db.query<UserRow>(
    `SELECT id, username, email, role, profile_picture_url, is_email_verified
     FROM users WHERE id=$1`,
    [id]
  );
  const u = rows[0];
  if (!u) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return u;
}

export async function updateMe(id: number, body: UpdateUserBody) {
  const { username, profile_picture_url } = body;

  const { rows } = await db.query<UserRow>(
    `UPDATE users
     SET username = COALESCE($2, username),
         profile_picture_url = COALESCE($3, profile_picture_url),
         updated_at = NOW()
     WHERE id=$1
     RETURNING id, username, email, role, profile_picture_url, is_email_verified`,
    [id, username ?? null, profile_picture_url ?? null]
  );

  const u = rows[0];
  if (!u) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return u;
}
