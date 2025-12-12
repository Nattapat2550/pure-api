import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { verifyJwt } from "../../utils/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; role: "user" | "admin"; email: string };
    }
  }
}

export function jwtAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const h = req.header("authorization");
    if (!h?.startsWith("Bearer ")) {
      throw new AppError("Missing Bearer token", 401, "JWT_MISSING");
    }
    const token = h.slice("Bearer ".length);
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError("Unauthorized", 401, "UNAUTHORIZED"));
  if (req.user.role !== "admin") return next(new AppError("Forbidden", 403, "FORBIDDEN"));
  return next();
}
