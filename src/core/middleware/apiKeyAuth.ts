// src/core/middleware/apiKeyAuth.ts
import { Request, RequestHandler } from 'express';
import { getApiClientByKey, ApiClient } from '../../utils/apiClient';
import { AppError } from '../errors/AppError';

export interface ApiRequest extends Request {
  apiClient?: ApiClient;
}

// Middleware: ใช้กับทุก /api/*
export const apiKeyAuth: RequestHandler = async (req, _res, next) => {
  try {
    const key =
      (req.headers['x-api-key'] as string | undefined) ||
      (req.query.api_key as string | undefined) ||
      (req.query.apiKey as string | undefined);

    if (!key) {
      throw AppError.unauthorized('Missing API key');
    }

    const client = await getApiClientByKey(key);
    if (!client) {
      throw AppError.unauthorized('Invalid API key');
    }

    (req as ApiRequest).apiClient = client;
    next();
  } catch (err) {
    next(err);
  }
};
