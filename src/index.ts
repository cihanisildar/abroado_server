import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import passport from 'passport';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { apiReference } from '@scalar/express-api-reference';

// Import Prisma client from dedicated module
import { checkDatabaseConnection, disconnectPrisma } from './lib/prisma';
import { checkRedisConnection } from './lib/redis';
import { prisma } from './lib/prisma';

// Import logger
import logger, { logInfo, logError, logWarn } from './lib/logger';

// Import middleware
import { requestIdMiddleware } from './middleware/requestId';
import httpLoggerMiddleware from './middleware/logger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { cacheMiddleware } from './middleware/cache';

// Import module routers
import { authRouter } from './modules/auth';
import { userRouter } from './modules/user';
import { roomRouter } from './modules/room';
import { cityRouter } from './modules/city';
import { postRouter } from './modules/post';
import { commentRouter } from './modules/comment';
import { cityReviewRouter, cityReviewCommentRouter } from './modules/city-review';

// Import services
import { initializeSocket } from './modules/room/infrastructure/SocketService';
import GoogleOAuthService from './modules/auth/infrastructure/GoogleOAuthService';

// Import Swagger configuration
import { swaggerSpec } from './config/swagger';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logError('Missing required environment variables', undefined, { missing: missingEnvVars });
  process.exit(1);
}

// Warn about optional but recommended environment variables
const recommendedEnvVars = ['JWT_REFRESH_SECRET', 'FRONTEND_URL'];
const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);

if (missingRecommended.length > 0) {
  logWarn('Missing recommended environment variables', { missing: missingRecommended });
}

logInfo('Environment variables loaded successfully');

// Initialize Google OAuth service (Prisma is now imported from lib/prisma)
GoogleOAuthService.getInstance(prisma);

const app = express();
app.set('trust proxy', 1); // Trust first proxy (needed for rate limiting behind load balancers)
const server = createServer(app);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://gurbetlik-client.vercel.app", // Production domain
      "https://api.abroado.com.tr",
      "https://abroado.com.tr",
      "https://abroado.com",
      "https://www.abroado.com",
      "https://www.abroado.com.tr",
    ];

    // Allow requests with no origin (server-to-server, health checks, etc.)
    if (!origin) {
      logger.debug('[CORS] Request with no origin - allowing');
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      logger.debug(`[CORS] Origin allowed: ${origin}`);
      callback(null, true);
    } else {
      logWarn('[CORS] Origin blocked', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-Access-Token',
    'X-Auth-Token'
  ],
  exposedHeaders: ['Authorization'],
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      const allowedOrigins = [
        process.env.FRONTEND_URL || "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://gurbetlik-client.vercel.app", // Production domain
        "https://api.abroado.com.tr",
        "https://abroado.com.tr",
        "https://abroado.com",
        "https://www.abroado.com",
        "https://www.abroado.com.tr",
      ];


      // Allow requests with no origin (server-to-server, health checks, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        logWarn('[Socket.IO] CORS blocked origin', { origin });
        callback(new Error('Not allowed by CORS policy'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
  }
});

// Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable if causing issues with external resources
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Middleware - ORDER MATTERS!
// 1. Request ID must be first for proper context propagation
app.use(requestIdMiddleware);

// 2. Security and parsing
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(passport.initialize());

// 3. HTTP logging (after parsing, before routes)
app.use(httpLoggerMiddleware);

// 4. Rate limiting
app.use(generalLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Gurbetci API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true
  }
}));

// Scalar API Reference - Modern alternative to Swagger UI
app.use('/reference', apiReference({
  spec: {
    content: swaggerSpec,
  },
  theme: 'default',
  darkMode: true,
  layout: 'modern',
  showSidebar: true,
  hideDownloadButton: false,
  searchHotKey: 'k'
}));

// Health check endpoint
app.get('/health', async (req, res) => {
  /* #swagger.path = '/health'
     #swagger.tags = ['System']
     #swagger.summary = 'Server Health Check'
  */
  const [dbConnected, redisConnected] = await Promise.all([
    checkDatabaseConnection(),
    checkRedisConnection()
  ]);

  const status = (dbConnected && redisConnected) ? 'OK' : 'DEGRADED';
  const statusCode = (dbConnected && redisConnected) ? 200 : 503;

  res.status(statusCode).json({
    status,
    message: 'Gurbetci Server is running',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
    redis: redisConnected ? 'connected' : 'disconnected',
    websocket: 'active',
    documentation: {
      swagger: '/api-docs',
      scalar: '/reference'
    }
  });
});

// Debug endpoint for production troubleshooting
app.get('/debug/env', (req, res) => {
  /* #swagger.path = '/debug/env'
     #swagger.tags = ['System']
     #swagger.summary = 'Environment Debug Info'
  */
  const envDebug = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    JWT_SECRET: process.env.JWT_SECRET ? '✓ Set' : '✗ Missing',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✓ Set' : '✗ Missing',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN ? `✓ Set: ${process.env.COOKIE_DOMAIN}` : '✗ Not set',
    FRONTEND_URL: process.env.FRONTEND_URL ? `✓ Set: ${process.env.FRONTEND_URL}` : '✗ Not set',
    DATABASE_URL: process.env.DATABASE_URL ? '✓ Set' : '✗ Missing',
    REDIS_HOST: process.env.REDIS_HOST ? `✓ Set: ${process.env.REDIS_HOST}` : '✗ Not set',
    REDIS_PORT: process.env.REDIS_PORT ? `✓ Set: ${process.env.REDIS_PORT}` : '✗ Not set',
    timestamp: new Date().toISOString()
  };

  res.json(envDebug);
});

// API Root - Info endpoint
app.get('/api', cacheMiddleware(3600), (req, res) => {
  /* #swagger.path = '/api'
     #swagger.tags = ['System']
     #swagger.summary = 'API Information'
  */
  res.json({
    message: 'Gurbetci Server API',
    version: '2.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      auth: '/api/auth',
      users: '/api/users',
      cities: '/api/cities',
      posts: '/api/posts',
      rooms: '/api/rooms',
      reviews: '/api/reviews',
      comments: '/api/comments'
    },
    features: [
      'User Authentication (JWT + Google OAuth)',
      'City Reviews & Ratings',
      'Posts & Comments',
      'Real-time Chat Rooms',
      'User Roles (Explorer/Abroader)',
      'WebSocket Support'
    ]
  });
});

// Mount module routers directly
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/cities', cityRouter);
app.use('/api/posts', postRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/comments', commentRouter);
app.use('/api/reviews', cityReviewRouter);
app.use('/api/city-review-comments', cityReviewCommentRouter);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize Socket.IO service
initializeSocket(io, prisma);

const PORT = process.env.PORT || 3001;

// Graceful shutdown
process.on('SIGINT', async () => {
  logInfo('Received SIGINT, shutting down gracefully...');

  // Close server
  server.close(() => {
    logInfo('HTTP server closed');
  });

  // Disconnect from database
  await disconnectPrisma();
  logInfo('Database connection closed');

  process.exit(0);
});

server.listen(PORT, () => {
  logInfo('Server started successfully', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    apiDocs: `http://localhost:${PORT}/api-docs`,
  });
}); 
