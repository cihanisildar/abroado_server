import { Router } from 'express';
import { authController, googleOAuthController } from '../../index';
import { authenticateToken } from '../../../../middleware/auth';
import { authLimiter } from '../../../../middleware/rateLimiter';
import { avatarUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Authentication routes
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authenticateToken, authController.logout);

// Profile routes
router.get('/profile', authenticateToken, cacheMiddleware({ ttl: 3600, isPrivate: true }), authController.getProfile);
router.put('/profile', authenticateToken, avatarUpload.single('avatar'), invalidateMiddleware(['/api/auth/profile', '/api/users']), authController.updateProfile);

// Google OAuth routes
router.get('/google', googleOAuthController.initiateGoogleAuth);
router.get('/google/callback', googleOAuthController.handleGoogleCallback);
router.get('/google/status', googleOAuthController.getGoogleAuthStatus);
router.delete('/google/unlink', authenticateToken, googleOAuthController.unlinkGoogleAccount);

export default router;
