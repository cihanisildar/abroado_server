import winston from 'winston';
import path from 'path';
import { requestContext } from './requestContext';
import { LogMetadata, ILogger } from '../types/global.d';

/**
 * Enterprise-grade Logger using Winston
 * 
 * Features:
 * - Automatic request context injection
 * - Structured JSON logging for production
 * - Pretty console output for development
 * - Log rotation and file management
 * - Log level based on environment
 * - Correlation ID tracking for distributed tracing
 * 
 * Design principles:
 * - Context automatically attached from AsyncLocalStorage
 * - All logs are searchable by requestId and correlationId
 * - Sensitive data should be redacted before logging
 * - Performance: minimal overhead in hot paths
 */

// Log levels following RFC 5424 (syslog) with additions
const levels = {
    error: 0,   // Error conditions
    warn: 1,    // Warning conditions
    info: 2,    // Informational messages
    http: 3,    // HTTP request logs
    debug: 4,   // Debug messages
};

const colors = {
    error: 'red bold',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'cyan',
};

winston.addColors(colors);

/**
 * Get log level based on environment
 */
const getLogLevel = (): string => {
    if (process.env.LOG_LEVEL) {
        return process.env.LOG_LEVEL;
    }
    return process.env.NODE_ENV === 'production' ? 'info' : 'debug';
};

/**
 * Custom format that injects request context automatically
 */
const contextInjector = winston.format((info) => {
    const ctx = requestContext.getLogContext();
    return { ...info, ...ctx };
});

/**
 * Console format for development (human-readable)
 */
const devConsoleFormat = winston.format.combine(
    contextInjector(),
    winston.format.timestamp({ format: 'HH:mm:ss.SSS' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ level, message, timestamp, requestId, correlationId, userId, ...meta }) => {
        // Build context prefix (with proper type handling)
        const reqIdStr = typeof requestId === 'string' ? requestId : '';
        const userIdStr = typeof userId === 'string' ? userId : '';
        const reqPart = reqIdStr && reqIdStr !== 'system' ? `[${reqIdStr.substring(0, 12)}]` : '';
        const userPart = userIdStr ? `[u:${userIdStr.substring(0, 8)}]` : '';
        const prefix = [reqPart, userPart].filter(Boolean).join(' ');

        // Build metadata suffix
        const metaKeys = Object.keys(meta).filter(k => !['service', 'module'].includes(k));
        let metaSuffix = '';
        if (metaKeys.length > 0) {
            const metaStr = metaKeys.map(k => {
                const v = meta[k];
                if (typeof v === 'object') return `${k}=${JSON.stringify(v)}`;
                return `${k}=${v}`;
            }).join(' ');
            metaSuffix = ` | ${metaStr}`;
        }

        return `${timestamp} ${level} ${prefix} ${message}${metaSuffix}`;
    })
);

/**
 * JSON format for production (machine-parseable)
 * Compatible with: ELK Stack, Datadog, Splunk, CloudWatch
 */
const prodJsonFormat = winston.format.combine(
    contextInjector(),
    winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

/**
 * Create transport array based on environment
 */
const createTransports = (): winston.transport[] => {
    const transports: winston.transport[] = [];
    const isProduction = process.env.NODE_ENV === 'production';

    // Console transport - always enabled
    transports.push(
        new winston.transports.Console({
            format: isProduction ? prodJsonFormat : devConsoleFormat,
        })
    );

    // File transports for production or when LOG_TO_FILE is set
    if (isProduction || process.env.LOG_TO_FILE === 'true') {
        const logDir = process.env.LOG_DIR || 'logs';

        // Error logs (for alerting systems)
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'error.log'),
                level: 'error',
                format: prodJsonFormat,
                maxsize: 10 * 1024 * 1024, // 10MB
                maxFiles: 10,
                tailable: true,
            })
        );

        // Combined logs (all levels)
        transports.push(
            new winston.transports.File({
                filename: path.join(logDir, 'combined.log'),
                format: prodJsonFormat,
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 10,
                tailable: true,
            })
        );
    }

    return transports;
};

/**
 * Create the main logger instance
 */
const winstonLogger = winston.createLogger({
    level: getLogLevel(),
    levels,
    defaultMeta: {
        service: process.env.SERVICE_NAME || 'gurbetci-api',
        version: process.env.npm_package_version || '1.0.0',
    },
    transports: createTransports(),
    exitOnError: false,
});

/**
 * Logger class with context-aware methods
 * Implements ILogger interface for dependency injection
 */
class Logger implements ILogger {
    private module: string | undefined;

    constructor(module?: string) {
        this.module = module ?? undefined;
    }

    private log(level: string, message: string, metadata?: LogMetadata): void {
        winstonLogger.log(level, message, {
            ...(this.module && { module: this.module }),
            ...metadata,
        });
    }

    error(message: string, metadata?: LogMetadata): void {
        this.log('error', message, metadata);
    }

    warn(message: string, metadata?: LogMetadata): void {
        this.log('warn', message, metadata);
    }

    info(message: string, metadata?: LogMetadata): void {
        this.log('info', message, metadata);
    }

    http(message: string, metadata?: LogMetadata): void {
        this.log('http', message, metadata);
    }

    debug(message: string, metadata?: LogMetadata): void {
        this.log('debug', message, metadata);
    }

    /**
     * Create a child logger with a module name
     * Useful for creating module-specific loggers
     */
    child(module: string): Logger {
        return new Logger(module);
    }
}

// Default logger instance
const logger = new Logger();

// Convenience functions that use the default logger
export const logError = (message: string, error?: Error | unknown, metadata?: LogMetadata): void => {
    const errorMeta: LogMetadata = { ...metadata };
    if (error instanceof Error) {
        errorMeta.error = error.message;
        errorMeta.stack = error.stack ?? undefined;
    } else if (error) {
        errorMeta.error = String(error);
    }
    logger.error(message, errorMeta);
};

export const logWarn = (message: string, metadata?: LogMetadata): void => {
    logger.warn(message, metadata);
};

export const logInfo = (message: string, metadata?: LogMetadata): void => {
    logger.info(message, metadata);
};

export const logHttp = (message: string, metadata?: LogMetadata): void => {
    logger.http(message, metadata);
};

export const logDebug = (message: string, metadata?: LogMetadata): void => {
    logger.debug(message, metadata);
};

/**
 * Create a module-specific logger
 * @example
 * const authLogger = createLogger('auth');
 * authLogger.info('User logged in', { userId: '123' });
 */
export const createLogger = (module: string): Logger => {
    return new Logger(module);
};

// Export the logger instance and class
export { Logger, winstonLogger };
export default logger;
