import Redis from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

/**
 * Redis Connection Singleton
 * 
 * This module manages the connection to Redis and provides
 * a centralized client for caching.
 */

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

// Create Redis client
const redis = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});

// Event handlers
redis.on('connect', () => {
    logger.info(`Redis connected to ${REDIS_HOST}:${REDIS_PORT}`);
});

redis.on('error', (error) => {
    logger.error('Redis connection error:', { error: error instanceof Error ? error.message : String(error) });
});

/**
 * Check Redis health
 */
export const checkRedisConnection = async (): Promise<boolean> => {
    try {
        const response = await redis.ping();
        return response === 'PONG';
    } catch (error) {
        logger.error('Redis health check failed:', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
};

/**
 * Cache utility functions
 */
export const cache = {
    /**
     * Get value from cache
     */
    get: async <T>(key: string): Promise<T | null> => {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error(`Error getting key ${key} from Redis:`, { error: error instanceof Error ? error.message : String(error) });
            return null;
        }
    },

    /**
     * Set value in cache with TTL (seconds)
     */
    set: async <T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> => {
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        } catch (error) {
            logger.error(`Error setting key ${key} in Redis:`, { error: error instanceof Error ? error.message : String(error) });
        }
    },

    /**
     * Delete from cache (supports multiple keys)
     */
    del: async (...keys: string[]): Promise<void> => {
        try {
            if (keys.length > 0) {
                await redis.del(...keys);
            }
        } catch (error) {
            logger.error(`Error deleting keys from Redis:`, { error: error instanceof Error ? error.message : String(error) });
        }
    },

    /**
     * Search for keys matching a pattern
     */
    keys: async (pattern: string): Promise<string[]> => {
        try {
            return await redis.keys(pattern);
        } catch (error) {
            logger.error(`Error searching for keys with pattern ${pattern}:`, { error: error instanceof Error ? error.message : String(error) });
            return [];
        }
    },

    /**
     * Flush all cache (use with caution)
     */
    flushAll: async (): Promise<void> => {
        try {
            await redis.flushall();
            logger.warn('Redis cache flushed');
        } catch (error) {
            logger.error('Error flushing Redis:', { error: error instanceof Error ? error.message : String(error) });
        }
    },
};

export default redis;
