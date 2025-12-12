import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { getClientByApiKey } from "../../utils/apiClient";

declare global {
  namespace Express {
    interface Request {
      client?: { id: number; name: string };
    }
  }
}

export async function apiKeyAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const apiKey = req.header("x-api-key");
    if (!apiKey) throw new AppError("Missing x-api-key", 401, "API_KEY_MISSING");

    const client = await getClientByApiKey(apiKey);
    if (!client) throw new AppError("Invalid API key", 401, "API_KEY_INVALID");

    req.client = { id: client.id, name: client.name };
    next();
  } catch (e) {
    next(e);
  }
}
