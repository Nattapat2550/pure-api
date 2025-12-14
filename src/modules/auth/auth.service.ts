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

export async function oauthGoogle(input: { email: string; oauthId: string; username?: string; pictureUrl?: string | null }): Promise<AuthResponse> {
  const email = input.email.toLowerCase();
  const provider = "google";

  // 1) try by oauth provider/id
  const byOAuth = await db.query<UserRow>(
    `SELECT id, username, email, password_hash, role, profile_picture_url, is_email_verified
     FROM users
     WHERE oauth_provider=$1 AND oauth_id=$2`,
    [provider, input.oauthId]
  );

  let u = byOAuth.rows[0];

  if (u) {
    // update optional fields
    const { rows } = await db.query<UserRow>(
      `UPDATE users SET
         email = COALESCE($2, email),
         is_email_verified = TRUE,
         profile_picture_url = COALESCE($3, profile_picture_url),
         username = COALESCE(username, $4)
       WHERE id=$1
       RETURNING id, username, email, password_hash, role, profile_picture_url, is_email_verified`,
      [u.id, email, input.pictureUrl ?? null, input.username ?? null]
    );
    u = rows[0];
  } else {
    // 2) try by email
    const byEmail = await db.query<UserRow>(
      `SELECT id, username, email, password_hash, role, profile_picture_url, is_email_verified
       FROM users
       WHERE email=$1`,
      [email]
    );

    u = byEmail.rows[0];

    if (u) {
      const { rows } = await db.query<UserRow>(
        `UPDATE users SET
           oauth_provider=$2,
           oauth_id=$3,
           is_email_verified=TRUE,
           profile_picture_url = COALESCE($4, profile_picture_url),
           username = COALESCE(username, $5)
         WHERE id=$1
         RETURNING id, username, email, password_hash, role, profile_picture_url, is_email_verified`,
        [u.id, provider, input.oauthId, input.pictureUrl ?? null, input.username ?? null]
      );
      u = rows[0];
    } else {
      // 3) create new user
      const username = input.username || email.split("@")[0];

      const { rows } = await db.query<UserRow>(
        `INSERT INTO users (username, email, password_hash, role, is_email_verified, oauth_provider, oauth_id, profile_picture_url)
         VALUES ($1,$2,NULL,'user', TRUE, $3, $4, $5)
         RETURNING id, username, email, password_hash, role, profile_picture_url, is_email_verified`,
        [username, email, provider, input.oauthId, input.pictureUrl ?? null]
      );
      u = rows[0];
    }
  }

  if (!u) throw new AppError("OAuth login failed", 401, "OAUTH_LOGIN_FAILED");

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
