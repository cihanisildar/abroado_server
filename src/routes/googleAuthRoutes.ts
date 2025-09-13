import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as googleOAuthController from '../controllers/GoogleOAuthController';

const router = express.Router();

/**
 * @swagger
 * /api/auth/google:
 *   get:
 *     summary: Initiate Google OAuth authentication
 *     tags: [Authentication]
 *     description: Redirects user to Google OAuth consent page
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 *       503:
 *         description: Google OAuth not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google', googleOAuthController.initiateGoogleAuth);

/**
 * @swagger
 * /api/auth/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     tags: [Authentication]
 *     description: Processes Google OAuth callback and sets authentication cookies
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Google OAuth authorization code
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: OAuth state parameter
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication cookies set
 *         headers:
 *           Set-Cookie:
 *             description: Authentication cookies (gb_accessToken, gb_refreshToken)
 *             schema:
 *               type: string
 *       503:
 *         description: Google OAuth not configured
 */
router.get('/google/callback', googleOAuthController.handleGoogleCallback);

/**
 * @swagger
 * /api/auth/google/status:
 *   get:
 *     summary: Get Google OAuth configuration status
 *     tags: [Authentication]
 *     description: Returns information about Google OAuth availability
 *     responses:
 *       200:
 *         description: Google OAuth status
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         configured:
 *                           type: boolean
 *                           description: Whether Google OAuth is properly configured
 *                         authUrl:
 *                           type: string
 *                           nullable: true
 *                           description: Google OAuth initiation URL
 *                         callbackUrl:
 *                           type: string
 *                           nullable: true
 *                           description: Google OAuth callback URL
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/google/status', googleOAuthController.getGoogleAuthStatus);

/**
 * @swagger
 * /api/auth/google/unlink:
 *   delete:
 *     summary: Unlink Google account from user profile
 *     tags: [Authentication]
 *     description: Removes Google account linking from authenticated user (requires password to be set)
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Google account unlinked successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Cannot unlink without alternative login method
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/google/unlink', authenticateToken, googleOAuthController.unlinkGoogleAccount);

export default router;