import { ErrorRequestHandler } from 'express';
import { AppError } from '../errors/AppError';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error('Unhandled error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof Error && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS blocked this request' });
  }

  return res.status(500).json({ error: 'Internal error' });
};
