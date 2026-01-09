import { Request, Response, NextFunction } from 'express';
import { logError, createLogger } from '../lib/logger';

// Create module-specific logger
const errorLogger = createLogger('error-handler');

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  isOperational?: boolean;
}

// Define safe error responses that don't leak sensitive information  
const safeErrors: Record<string, { message: string; statusCode: number }> = {
  'ValidationError': { message: 'Invalid input provided', statusCode: 400 },
  'JsonWebTokenError': { message: 'Invalid token', statusCode: 401 },
  'TokenExpiredError': { message: 'Token expired', statusCode: 401 },
  'UnauthorizedError': { message: 'Authentication required', statusCode: 401 },
  'ForbiddenError': { message: 'Access denied', statusCode: 403 },
  'NotFoundError': { message: 'Resource not found', statusCode: 404 },
  'ConflictError': { message: 'Resource conflict', statusCode: 409 },
  'TooManyRequestsError': { message: 'Too many requests', statusCode: 429 },
  'PrismaClientKnownRequestError': { message: 'Database error', statusCode: 500 },
  'PrismaClientValidationError': { message: 'Invalid data', statusCode: 400 },
};

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  // Use request ID if available, otherwise generate one
  const errorId = req.requestId || crypto.randomUUID();

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // Log full error details using Winston
  logError(`[${errorId}] ${err.message}`, err, {
    errorId,
    requestId: req.requestId,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    statusCode,
    errorName: err.name,
    errorCode: err.code,
    userId: (req as any).user?.id,
  });

  // Get safe error message or use generic one
  const safeError = safeErrors[err.name];
  let message = safeError?.message || 'An error occurred while processing your request';

  // For operational errors (expected errors), we can be more specific
  if (err.isOperational) {
    message = err.message;
  }

  // Prepare response
  interface ErrorResponse {
    success: false;
    message: string;
    errorId: string;
    details?: {
      originalMessage: string;
      stack: string | undefined;
      code: string | undefined;
    };
  }

  const response: ErrorResponse = {
    success: false,
    message,
    errorId, // Include error ID for support correlation
  };

  // Only include additional details in development
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      originalMessage: err.message,
      stack: err.stack,
      code: err.code,
    };
  }

  // Log warning for 4xx errors, error for 5xx
  if (statusCode >= 500) {
    errorLogger.error(`Server error: ${message}`, { errorId, statusCode });
  } else if (statusCode >= 400) {
    errorLogger.warn(`Client error: ${message}`, { errorId, statusCode });
  }

  res.status(statusCode).json(response);
};

/**
 * Custom error class for operational errors
 * Use this for expected errors that should be communicated to the client
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string | undefined;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code ?? undefined;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const createNotFoundError = (resource: string = 'Resource'): AppError => {
  return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
};

export const createUnauthorizedError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401, 'UNAUTHORIZED');
};

export const createForbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403, 'FORBIDDEN');
};

export const createValidationError = (message: string = 'Validation failed'): AppError => {
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

export const createConflictError = (message: string = 'Resource conflict'): AppError => {
  return new AppError(message, 409, 'CONFLICT');
};

export default errorHandler;