export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode = 400, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static unauthorized(msg = 'Unauthorized') {
    return new AppError(msg, 401);
  }

  static forbidden(msg = 'Forbidden') {
    return new AppError(msg, 403);
  }

  static notFound(msg = 'Not found') {
    return new AppError(msg, 404);
  }
}
