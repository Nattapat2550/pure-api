import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const e =
    err instanceof AppError
      ? err
      : new AppError("Unexpected error", 500, "INTERNAL_ERROR", err);

  res.status(e.statusCode).json({
    ok: false,
    error: {
      code: e.code,
      message: e.message,
      details: e.statusCode >= 500 ? undefined : e.details
    }
  });
}
