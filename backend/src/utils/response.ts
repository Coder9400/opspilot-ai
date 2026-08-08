import { Response } from 'express';

/**
 * Send a successful JSON response.
 * Returns data directly at the top level (no {success, data} wrapper).
 * The frontend's parseResponse() returns body as-is, so callers read
 * body.token, body.enquiry, body.enquiries, etc. directly.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json(data);
}

/**
 * Send an error JSON response.
 * Returns { message, error: { code, message } } so the frontend's
 * parseResponse can find body.message for the Error constructor.
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 500,
  details?: unknown
): void {
  res.status(statusCode).json({
    success: false,
    message,          // top-level message for frontend parseResponse
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  });
}
