import { Request, Response, CookieOptions } from 'express';
import passport from 'passport';
import { AuthController } from './AuthController';
import GoogleOAuthService from '../../infrastructure/GoogleOAuthService';
import { prisma } from '../../../../lib/prisma';
import { getAuthenticatedUserId } from '../../../../utils/authHelpers';
import {
    createSuccessResponse,
    createErrorResponse
} from '../../../../types';

const googleOAuthService = GoogleOAuthService.getInstance(prisma);

const getCookieOptions = (isProduction: boolean): CookieOptions => {
    const baseOptions = {
        httpOnly: true,
        secure: isProduction,
        path: '/',
        sameSite: isProduction ? 'none' as const : 'lax' as const,
    };

    if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim() !== '') {
        return {
            ...baseOptions,
            domain: process.env.COOKIE_DOMAIN.trim()
        };
    }

    return baseOptions;
};

export class GoogleOAuthController {
    constructor(private authController: AuthController) { }

    public initiateGoogleAuth = (req: Request, res: Response): void => {
        if (!googleOAuthService.isConfigured()) {
            res.status(503).json(createErrorResponse('Google OAuth is not configured'));
            return;
        }

        console.log('[OAuth] Initiating Google OAuth authentication');

        passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false
        })(req, res);
    };

    public handleGoogleCallback = (req: Request, res: Response): void => {
        if (!googleOAuthService.isConfigured()) {
            res.status(503).json(createErrorResponse('Google OAuth is not configured'));
            return;
        }

        passport.authenticate('google', {
            session: false,
            failureRedirect: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login?error=oauth_failed` : '/login?error=oauth_failed'
        }, async (err: any, googleAuthResult: any) => {
            try {
                if (err) {
                    console.error('[OAuth] Google OAuth error:', err);
                    const redirectUrl = process.env.FRONTEND_URL ?
                        `${process.env.FRONTEND_URL}/login?error=oauth_error` :
                        '/login?error=oauth_error';
                    res.redirect(redirectUrl);
                    return;
                }

                if (!googleAuthResult) {
                    console.error('[OAuth] Google OAuth failed - no user data');
                    const redirectUrl = process.env.FRONTEND_URL ?
                        `${process.env.FRONTEND_URL}/login?error=oauth_denied` :
                        '/login?error=oauth_denied';
                    res.redirect(redirectUrl);
                    return;
                }

                console.log(`[OAuth] Google OAuth callback successful for user: ${googleAuthResult.user.email}`);

                // Process the authentication result using AuthController
                const result = await this.authController.processGoogleAuth(googleAuthResult);
                const isProduction = process.env.NODE_ENV === 'production';
                const cookieOptions = getCookieOptions(isProduction);

                res.cookie('gb_accessToken', result.accessToken, {
                    ...cookieOptions,
                    maxAge: 15 * 60 * 1000,
                });

                res.cookie('gb_refreshToken', result.refreshToken, {
                    ...cookieOptions,
                    maxAge: 30 * 24 * 60 * 60 * 1000,
                });

                console.log(`[OAuth] Cookies set for Google OAuth user: ${result.user.email}`);

                const redirectUrl = process.env.FRONTEND_URL ?
                    `${process.env.FRONTEND_URL}/dashboard${result.isNewUser ? '?welcome=true' : ''}` :
                    `/dashboard${result.isNewUser ? '?welcome=true' : ''}`;

                res.redirect(redirectUrl);

            } catch (error) {
                console.error('[OAuth] Error processing Google OAuth callback:', error);
                const redirectUrl = process.env.FRONTEND_URL ?
                    `${process.env.FRONTEND_URL}/login?error=oauth_error` :
                    '/login?error=oauth_error';
                res.redirect(redirectUrl);
            }
        })(req, res);
    };

    public getGoogleAuthStatus = async (req: Request, res: Response): Promise<void> => {
        try {
            res.json(createSuccessResponse('Google OAuth status', {
                configured: googleOAuthService.isConfigured(),
                authUrl: googleOAuthService.isConfigured() ? googleOAuthService.getAuthUrl() : null,
                callbackUrl: googleOAuthService.isConfigured() ? googleOAuthService.getCallbackUrl() : null
            }));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to get Google OAuth status', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public unlinkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);

            // Check if user has a password set - prevent unlinking if they don't have alternative login method
            const userWithPassword = await prisma.user.findUnique({
                where: { id: userId },
                select: { password: true, googleId: true, email: true }
            });

            if (!userWithPassword) {
                res.status(404).json(createErrorResponse('User not found'));
                return;
            }

            if (!userWithPassword?.password && userWithPassword?.googleId) {
                res.status(400).json(createErrorResponse('Cannot unlink Google account without setting a password first'));
                return;
            }

            // Unlink Google account
            await prisma.user.update({
                where: { id: userId },
                data: {
                    googleId: null,
                    updatedAt: new Date()
                }
            });

            console.log(`[OAuth] Google account unlinked for user: ${userWithPassword.email}`);

            res.json(createSuccessResponse('Google account unlinked successfully', null));
        } catch (error) {
            console.error('[OAuth] Error unlinking Google account:', error);
            res.status(500).json(createErrorResponse('Failed to unlink Google account', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
