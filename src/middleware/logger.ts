import { Request, Response, NextFunction } from 'express';
import { createLogger, logError } from '../lib/logger';

// Type declarations are loaded via tsconfig.json

/**
 * HTTP Request/Response Logger Middleware
 * 
 * This middleware logs HTTP requests and responses with timing information.
 * It should be placed AFTER the requestId middleware to have access to request context.
 * 
 * Features:
 * - Logs incoming requests
 * - Logs response with status code and duration
 * - Different log levels based on status code
 * - Redacts sensitive data from logs
 */

const httpLogger = createLogger('http');

// Paths to exclude from logging (health checks, metrics, etc.)
const EXCLUDED_PATHS = ['/health', '/metrics', '/ready', '/live'];

// Headers that should not be logged
const SENSITIVE_HEADERS = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];

// Query params that should be redacted
const SENSITIVE_PARAMS = ['password', 'token', 'secret', 'key', 'apikey', 'api_key'];

/**
 * Redact sensitive values from an object
 */
const redactSensitiveData = (data: Record<string, unknown>): Record<string, unknown> => {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_PARAMS.some(s => lowerKey.includes(s))) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value as Record<string, unknown>);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
};

/**
 * Get safe headers (excluding sensitive ones)
 */
const getSafeHeaders = (req: Request): Record<string, string> => {
  const headers: Record<string, string> = {};

  // Only include useful headers
  const includeHeaders = ['content-type', 'accept', 'user-agent', 'x-forwarded-for', 'origin', 'referer'];

  for (const header of includeHeaders) {
    const value = req.get(header);
    if (value && !SENSITIVE_HEADERS.includes(header)) {
      headers[header] = header === 'user-agent' ? truncate(value, 100) : value;
    }
  }

  return headers;
};

/**
 * Truncate string to max length
 */
const truncate = (str: string, maxLength: number): string => {
  return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str;
};

/**
 * Get client IP address
 */
const getClientIp = (req: Request): string => {
  const forwarded = req.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0];
    return firstIp?.trim() ?? 'unknown';
  }
  return req.ip || 'unknown';
};

/**
 * HTTP Logger Middleware
 */
const httpLoggerMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  // Skip logging for excluded paths
  if (EXCLUDED_PATHS.some(p => req.path.startsWith(p))) {
    return next();
  }

  // Log incoming request
  httpLogger.http(`→ ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? redactSensitiveData(req.query as Record<string, unknown>) : undefined,
    ip: getClientIp(req),
    userAgent: truncate(req.get('user-agent') || 'unknown', 100),
  });

  // Capture original methods
  const originalSend = res.send.bind(res);
  let responseBody: unknown;

  // Override send to capture response body size
  res.send = function (body: unknown) {
    responseBody = body;
    return originalSend(body);
  };

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    const statusCode = res.statusCode;

    // Calculate response size
    const contentLength = res.get('content-length');
    const responseSize = contentLength
      ? parseInt(contentLength, 10)
      : (typeof responseBody === 'string' ? responseBody.length : 0);

    const logData = {
      method: req.method,
      path: req.originalUrl,
      statusCode,
      duration: `${duration}ms`,
      responseSize: `${responseSize}b`,
    };

    // Log at appropriate level based on status code
    if (statusCode >= 500) {
      httpLogger.error(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`, logData);
    } else if (statusCode >= 400) {
      httpLogger.warn(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`, logData);
    } else {
      httpLogger.http(`← ${req.method} ${req.path} ${statusCode} (${duration}ms)`, logData);
    }
  });

  // Log errors
  res.on('error', (error: Error) => {
    logError('Response stream error', error, {
      method: req.method,
      path: req.originalUrl,
    });
  });

  next();
};

export default httpLoggerMiddleware;