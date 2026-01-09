import { Request, Response, NextFunction } from 'express';
import { cache } from '../lib/redis';
import { createLogger } from '../lib/logger';

const logger = createLogger('cache-middleware');

/**
 * Options for caching
 */
interface CacheOptions {
    ttl?: number;       // Time to live in seconds (default: 3600)
    isPrivate?: boolean; // If true, ALWAYS force per-user cache even if guest (denies guests if force-private)
}

/**
 * Middleware to cache Express responses in Redis properly.
 * Supports public (global) and adaptive (per-user if logged in) caching.
 */
export const cacheMiddleware = (options: CacheOptions | number = 3600) => {
    const ttl = typeof options === 'number' ? options : (options.ttl || 3600);
    const forcePrivate = typeof options === 'object' ? options.isPrivate : false;

    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const user = (req as any).user;

        // Determine the Cache Key Prefix
        let keyPrefix = 'api-cache:';

        if (user?.id) {
            // Logged in user: Always different key
            keyPrefix += `user:${user.id}:`;
        } else if (forcePrivate) {
            // Guest trying to access a forced-private cache: Skip caching
            return next();
        } else {
            // Guest: Global key
            keyPrefix += 'global:';
        }

        const key = `${keyPrefix}${req.originalUrl || req.url}`;

        try {
            // Check if we have a cached response
            const cachedResponse = await cache.get(key);

            if (cachedResponse) {
                logger.debug(`Cache HIT for ${key}`);
                // Add a header so we can tell it came from Redis
                res.setHeader('X-Redis-Cache', 'HIT');
                return res.json(cachedResponse);
            }

            logger.debug(`Cache MISS for ${key}`);
            res.setHeader('X-Redis-Cache', 'MISS');

            // Capture the original res.json so we can intercept the response
            const originalJson = res.json;

            // Wrap res.json to store the data in Redis before sending
            res.json = function (body: any) {
                // Only cache successful (2xx) responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    cache.set(key, body, ttl).catch((err) => {
                        logger.error(`Failed to set cache for ${key}:`, { error: err.message });
                    });
                }

                return originalJson.call(this, body);
            };

            next();
        } catch (error) {
            logger.error(`Cache middleware error for ${key}:`, { error: error instanceof Error ? error.message : String(error) });
            next();
        }
    };
};

/**
 * Utility to clear the cache for specific patterns or keys
 */
export const clearCache = async (pattern: string) => {
    try {
        if (pattern.includes('*')) {
            const keys = await cache.keys(pattern);
            if (keys.length > 0) {
                await cache.del(...keys);
                logger.debug(`Cleared ${keys.length} keys matching ${pattern}`);
            }
        } else {
            await cache.del(pattern);
            logger.debug(`Cleared key ${pattern}`);
        }
    } catch (error) {
        logger.error(`Failed to clear cache for pattern ${pattern}:`, { error: error instanceof Error ? error.message : String(error) });
    }
};

/**
 * Middleware to invalidate specific cache paths after a successful mutation.
 * 
 * @param paths - Array of paths to invalidate (e.g., ['/api/users', '/api/posts'])
 */
export const invalidateMiddleware = (paths: string[] | ((req: Request) => string[])) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Record the original end/json/send to detect success
        const originalJson = res.json;

        res.json = function (body: any) {
            // Only invalidate if the request was successful (2xx)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const resolvedPaths = typeof paths === 'function' ? paths(req) : paths;
                const user = (req as any).user;

                resolvedPaths.forEach(async (path) => {
                    // 1. Clear Global Cache for this path
                    const globalKey = `api-cache:global:${path}*`;
                    clearCache(globalKey);

                    // 2. Clear User-Specific Cache for this user (if logged in)
                    if (user?.id) {
                        const userKey = `api-cache:user:${user.id}:${path}*`;
                        clearCache(userKey);
                    }

                    // 3. If the path is exact (no glob), clear it directly too
                    if (!path.includes('*')) {
                        clearCache(`api-cache:global:${path}`);
                        if (user?.id) {
                            clearCache(`api-cache:user:${user.id}:${path}`);
                        }
                    }
                });

                logger.info(`Invalidated cache for paths: ${resolvedPaths.join(', ')}`);
            }
            return originalJson.call(this, body);
        };

        next();
    };
};
