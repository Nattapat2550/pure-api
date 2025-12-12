import { db } from "../../config/db";
import { AppError } from "../../core/errors/AppError";
import { hashPassword, verifyPassword } from "../../utils/password";
import { signJwt } from "../../utils/jwt";
import { LoginBody, RegisterBody, AuthResponse } from "./auth.types";

type UserRow = {
  id: number;
  username: string | null;
  email: string;
  password_hash: string | null;
  role: "user" | "admin";
  profile_picture_url: string | null;
  is_email_verified: boolean;
};

export async function register(input: RegisterBody): Promise<AuthResponse> {
  const pw = await hashPassword(input.password);

  try {
    const { rows } = await db.query<UserRow>(
      `INSERT INTO users (username, email, password_hash, role, is_email_verified)
       VALUES ($1,$2,$3,'user', FALSE)
       RETURNING id, username, email, password_hash, role, profile_picture_url, is_email_verified`,
      [input.username ?? null, input.email.toLowerCase(), pw]
    );

    const u = rows[0];
    const token = signJwt({ sub: u.id, role: u.role, email: u.email });

    return {
      token,
      user: {
        id: u.id,
        email: u.email,
        username: u.username,
        role: u.role,
        profile_picture_url: u.profile_picture_url,
        is_email_verified: u.is_email_verified
      }
    };
  } catch (e: any) {
    if (String(e?.message || "").includes("users_email_key") || String(e?.message || "").includes("duplicate")) {
      throw new AppError("Email already exists", 409, "EMAIL_EXISTS");
    }
    throw e;
  }
}

export async function login(input: LoginBody): Promise<AuthResponse> {
  const { rows } = await db.query<UserRow>(
    `SELECT id, username, email, password_hash, role, profile_picture_url, is_email_verified
     FROM users
     WHERE email = $1`,
    [input.email.toLowerCase()]
  );

  const u = rows[0];
  if (!u || !u.password_hash) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const ok = await verifyPassword(input.password, u.password_hash);
  if (!ok) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

  const token = signJwt({ sub: u.id, role: u.role, email: u.email });

  return {
    token,
    user: {
      id: u.id,
      email: u.email,
      username: u.username,
      role: u.role,
      profile_picture_url: u.profile_picture_url,
      is_email_verified: u.is_email_verified
    }
  };
}

export async function getMe(userId: number) {
  const { rows } = await db.query<Omit<UserRow, "password_hash">>(
    `SELECT id, username, email, role, profile_picture_url, is_email_verified
     FROM users
     WHERE id = $1`,
    [userId]
  );
  const u = rows[0];
  if (!u) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  return u;
}
