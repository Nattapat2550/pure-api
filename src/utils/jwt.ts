import jwt, { type Secret } from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../core/errors/AppError";

export type JwtPayload = {
  sub: number;
  role: "user" | "admin";
  email: string;
};

export function signJwt(payload: JwtPayload) {
  const secret: Secret = env.JWT_SECRET;

  // บาง typings ของ jsonwebtoken เข้มกับ expiresIn (StringValue) มาก
  // เลย cast เฉพาะ field นี้เพื่อให้ "30d" ผ่าน TS ได้
  return jwt.sign(payload, secret, { expiresIn: env.JWT_EXPIRES_IN as any });
}

export function verifyJwt(token: string): JwtPayload {
  try {
    const secret: Secret = env.JWT_SECRET;

    const decoded = jwt.verify(token, secret);
    if (!decoded || typeof decoded === "string") throw new Error("bad token payload");

    const obj = decoded as Partial<JwtPayload>;

    if (
      typeof obj.sub !== "number" ||
      (obj.role !== "user" && obj.role !== "admin") ||
      typeof obj.email !== "string"
    ) {
      throw new Error("bad token shape");
    }

    return obj as JwtPayload;
  } catch (e) {
    throw new AppError("Invalid token", 401, "JWT_INVALID", e);
  }
}
