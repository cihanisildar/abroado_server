/**
 * Global Type Declarations
 * 
 * This file contains all global type extensions and shared interfaces.
 * Consolidates Express, Multer, and application-specific type declarations.
 */

import 'express';
import 'multer';

// ============================================================================
// Express Types
// ============================================================================

/**
 * Authenticated user attached to request after auth middleware
 */
export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    role: string;
    googleId?: string;
}

declare global {
    namespace Express {
        interface Request {
            // Multer file uploads
            file?: Express.Multer.File;
            files?: Express.Multer.File[];

            // Authentication (set by auth middleware)
            user?: AuthenticatedUser;

            // Request tracing (set by requestId middleware)
            requestId: string;
            correlationId: string;
            startTime: number;
        }
    }
}

// ============================================================================
// Request Context (AsyncLocalStorage)
// ============================================================================

/**
 * Request context that flows through all async operations via AsyncLocalStorage
 */
export interface RequestContext {
    requestId: string;
    correlationId: string;
    startTime: number;
    userId?: string;
    userEmail?: string;
    path?: string;
    method?: string;
}

// ============================================================================
// Logging Types
// ============================================================================

/**
 * Structured log metadata
 * Used for all log entries to ensure consistent, searchable logs
 */
export interface LogMetadata {
    // Tracing
    requestId?: string;
    correlationId?: string;

    // User context
    userId?: string;

    // HTTP context
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: string;

    // Error context
    error?: string;
    stack?: string | undefined;

    // Allow additional properties
    [key: string]: unknown;
}

/**
 * Logger interface for dependency injection and testing
 */
export interface ILogger {
    error(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    http(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API success response
 */
export interface ApiSuccessResponse<T = unknown> {
    success: true;
    message: string;
    data: T;
}

/**
 * Standard API error response
 */
export interface ApiErrorResponse {
    success: false;
    message: string;
    errorId?: string;
    details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export { };
