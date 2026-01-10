import { Router } from 'express';
import { authController, googleOAuthController } from '../../index';
import { authenticateToken } from '../../../../middleware/auth';
import { authLimiter } from '../../../../middleware/rateLimiter';
import { avatarUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// #swagger.tags = ['Auth']

router.post('/register', authLimiter, (req, res) => {
    /* #swagger.path = '/api/auth/register'
       #swagger.tags = ['Auth']
       #swagger.summary = 'User Registration'
       #swagger.parameters['body'] = {
            in: 'body',
            description: 'User details',
            schema: {
                email: 'user@example.com',
                username: 'johndoe',
                password: 'password123',
                role: 'EXPLORER'
            }
       }
       #swagger.responses[201] = {
            description: 'Created',
            schema: { $ref: '#/definitions/AuthResponse' }
       }
    */
    authController.register(req, res);
});

router.post('/login', authLimiter, (req, res) => {
    /* #swagger.path = '/api/auth/login'
       #swagger.tags = ['Auth']
       #swagger.summary = 'User Login'
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { email: 'user@example.com', password: 'password123' }
       }
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/AuthResponse' }
       }
    */
    authController.login(req, res);
});

router.post('/refresh', (req, res) => {
    /* #swagger.path = '/api/auth/refresh'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Refresh Access Token'
       #swagger.responses[200] = {
            description: 'Success'
       }
    */
    authController.refresh(req, res);
});

router.post('/logout', authenticateToken, (req, res) => {
    /* #swagger.path = '/api/auth/logout'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Logout User'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.responses[200] = {
            description: 'Success'
       }
    */
    authController.logout(req, res);
});

router.get('/profile', authenticateToken, cacheMiddleware({ ttl: 3600, isPrivate: true }), (req, res) => {
    /* #swagger.path = '/api/auth/profile'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Get Profile'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/AuthResponse' }
       }
    */
    authController.getProfile(req, res);
});

router.put('/profile', authenticateToken, avatarUpload.single('avatar'), invalidateMiddleware(['/api/auth/profile', '/api/users']), (req, res) => {
    /* #swagger.path = '/api/auth/profile'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Update Profile'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { $ref: '#/definitions/User' }
       }
    */
    authController.updateProfile(req, res);
});

// Google OAuth routes
router.get('/google', (req, res) => {
    /* #swagger.path = '/api/auth/google'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Initiate Google OAuth'
    */
    googleOAuthController.initiateGoogleAuth(req, res);
});

router.get('/google/callback', (req, res) => {
    /* #swagger.path = '/api/auth/google/callback'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Google OAuth Callback'
    */
    googleOAuthController.handleGoogleCallback(req, res);
});

router.get('/google/status', (req, res) => {
    /* #swagger.path = '/api/auth/google/status'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Get Google Auth Status'
    */
    googleOAuthController.getGoogleAuthStatus(req, res);
});

router.delete('/google/unlink', authenticateToken, (req, res) => {
    /* #swagger.path = '/api/auth/google/unlink'
       #swagger.tags = ['Auth']
       #swagger.summary = 'Unlink Google Account'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    googleOAuthController.unlinkGoogleAccount(req, res);
});

export default router;
