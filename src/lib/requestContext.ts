import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../types/global.d';

/**
 * Request Context Store using AsyncLocalStorage
 * 
 * This is the industry-standard approach for propagating request context
 * through async operations without explicit parameter passing.
 * 
 * Used by: Stripe, Datadog, OpenTelemetry, AWS X-Ray
 * 
 * Benefits:
 * - Automatic context propagation in async code
 * - No need to pass context through every function
 * - Works with Promises, async/await, and callbacks
 * - Thread-safe (each async context is isolated)
 * 
 * Usage:
 * ```typescript
 * // In middleware - set context
 * requestContext.run(context, () => next());
 * 
 * // Anywhere in async chain - get context
 * const ctx = requestContext.getContext();
 * logger.info('Processing', { requestId: ctx?.requestId });
 * ```
 */
class RequestContextStore {
    private storage: AsyncLocalStorage<RequestContext>;

    constructor() {
        this.storage = new AsyncLocalStorage<RequestContext>();
    }

    /**
     * Run a function within a request context
     * All async operations within the callback will have access to this context
     */
    run<T>(context: RequestContext, callback: () => T): T {
        return this.storage.run(context, callback);
    }

    /**
     * Get the current request context
     * Returns undefined if called outside of a request context
     */
    getContext(): RequestContext | undefined {
        return this.storage.getStore();
    }

    /**
     * Get request ID from current context
     * Returns 'system' if no context (for startup logs, background jobs, etc.)
     */
    getRequestId(): string {
        return this.storage.getStore()?.requestId ?? 'system';
    }

    /**
     * Get correlation ID from current context
     * Returns undefined if no context
     */
    getCorrelationId(): string | undefined {
        return this.storage.getStore()?.correlationId;
    }

    /**
     * Get user ID from current context (if authenticated)
     */
    getUserId(): string | undefined {
        return this.storage.getStore()?.userId;
    }

    /**
     * Update the current context (e.g., after authentication)
     */
    updateContext(updates: Partial<RequestContext>): void {
        const current = this.storage.getStore();
        if (current) {
            Object.assign(current, updates);
        }
    }

    /**
     * Get context metadata for logging
     * Returns only the relevant fields for log output
     */
    getLogContext(): Record<string, unknown> {
        const ctx = this.storage.getStore();
        if (!ctx) {
            return {};
        }

        return {
            requestId: ctx.requestId,
            correlationId: ctx.correlationId,
            ...(ctx.userId && { userId: ctx.userId }),
            ...(ctx.method && { method: ctx.method }),
            ...(ctx.path && { path: ctx.path }),
        };
    }
}

// Singleton instance
export const requestContext = new RequestContextStore();

export default requestContext;
