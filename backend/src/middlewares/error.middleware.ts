import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { sendError } from '../utils/response';
import { env } from '../config/env';

// Prisma known error codes
const PRISMA_UNIQUE_VIOLATION = 'P2002';
const PRISMA_NOT_FOUND = 'P2025';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Our own typed errors
  if (err instanceof AppError) {
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Zod validation errors (thrown directly without wrapping)
  if (err instanceof ZodError) {
    sendError(res, 'VALIDATION_ERROR', 'Request validation failed', 400, err.flatten());
    return;
  }

  // Prisma errors
  const prismaCode = (err as unknown as Record<string, unknown>).code;
  if (prismaCode === PRISMA_UNIQUE_VIOLATION) {
    sendError(res, 'CONFLICT', 'A record with this data already exists', 409);
    return;
  }
  if (prismaCode === PRISMA_NOT_FOUND) {
    sendError(res, 'NOT_FOUND', 'The requested record was not found', 404);
    return;
  }

  // Log unexpected errors (never expose stack in production)
  if (!env.isProduction) {
    console.error('[ErrorHandler]', err);
  } else {
    console.error('[ErrorHandler]', err.message);
  }

  sendError(
    res,
    'INTERNAL_ERROR',
    env.isProduction
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    500
  );
}
