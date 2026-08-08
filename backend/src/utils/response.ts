import { Response } from 'express';
import { ApiSuccess, ApiErrorPayload } from '../types';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiSuccess<T> = { success: true, data };
  res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
): void {
  const response: ApiErrorPayload = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  res.status(statusCode).json(response);
}
