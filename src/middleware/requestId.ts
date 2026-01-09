import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { requestContext } from '../lib/requestContext';
import { RequestContext } from '../types/global.d';

// Import types (this ensures global.d.ts is loaded)
import '../types/global.d';

/**
 * Request ID Middleware
 * 
 * Assigns unique identifiers to each request for distributed tracing.
 * This is a fundamental practice used by all major tech companies.
 * 
 * Headers:
 * - X-Request-ID: Unique ID for this specific request
 * - X-Correlation-ID: ID that links related requests (passed from client or generated)
 * 
 * The correlation ID is particularly important for:
 * - Mobile apps making multiple related API calls
 * - Frontend SPAs with grouped operations
 * - Service-to-service calls in microservices
 * 
 * This middleware should be one of the FIRST middlewares in the chain.
 */

/**
 * Generate a unique request ID
 * Format: timestamp-random (sortable and unique)
 */
const generateRequestId = (): string => {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString('hex');
    return `${timestamp}-${random}`;
};

/**
 * Main request ID middleware
 */
export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Get or generate request ID
    // Respect incoming X-Request-ID for service-to-service calls
    const incomingRequestId = req.get('X-Request-ID');
    const requestId = incomingRequestId || generateRequestId();

    // Get or generate correlation ID
    // Correlation ID should be passed from the original client request
    const correlationId = req.get('X-Correlation-ID') || requestId;

    // Record start time for duration calculation
    const startTime = Date.now();

    // Set on request object for easy access
    req.requestId = requestId;
    req.correlationId = correlationId;
    req.startTime = startTime;

    // Set response headers for client-side correlation
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Correlation-ID', correlationId);

    // Create request context
    const context: RequestContext = {
        requestId,
        correlationId,
        startTime,
        method: req.method,
        path: req.path,
    };

    // Run the rest of the middleware chain within the request context
    // This makes context available to ALL async operations downstream
    requestContext.run(context, () => {
        next();
    });
};

/**
 * Middleware to update request context with user info after authentication
 * Should be called after authentication middleware
 */
export const enrichRequestContext = (
    req: Request,
    _res: Response,
    next: NextFunction
): void => {
    // User is set by auth middleware with AuthenticatedUser type
    const user = req.user;
    if (user && 'id' in user && 'email' in user) {
        requestContext.updateContext({
            userId: user.id as string,
            userEmail: user.email as string,
        });
    }
    next();
};

export default requestIdMiddleware;

