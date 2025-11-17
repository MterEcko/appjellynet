import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/error.util';
import { logger } from '../utils/logger.util';
import { sendError } from '../utils/response.util';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    sendError(res, 'DATABASE_ERROR', 'Database error occurred', 500);
    return;
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    sendError(res, 'VALIDATION_ERROR', 'Validation failed', 400, err);
    return;
  }

  // Generic error
  sendError(res, 'INTERNAL_ERROR', 'An unexpected error occurred', 500);
};
