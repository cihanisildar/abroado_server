import { Request, Response, CookieOptions } from 'express';
import passport from 'passport';
import { prisma } from '../lib/prisma';
import * as authService from '../services/AuthService';
import GoogleOAuthService from '../services/GoogleOAuthService';
import { getAuthenticatedUserId } from '../utils/authHelpers';
import {
  createSuccessResponse,
  createErrorResponse
} from '../types';

// Initialize Google OAuth service
const googleOAuthService = GoogleOAuthService.getInstance(prisma);

const getCookieOptions = (isProduction: boolean): CookieOptions => {
  const baseOptions = {
    httpOnly: true,
    secure: isProduction, // Only require HTTPS in production
    path: '/',
    sameSite: isProduction ? 'none' as const : 'lax' as const, // 'none' for cross-origin in prod, 'lax' for dev
  };

  // Only add domain if explicitly set and not empty in environment variables
  if (process.env.COOKIE_DOMAIN && process.env.COOKIE_DOMAIN.trim() !== '') {
    return {
      ...baseOptions,
      domain: process.env.COOKIE_DOMAIN.trim()
    };
  }

  // For local development or production without COOKIE_DOMAIN, don't set domain
  return baseOptions;
};

export const initiateGoogleAuth = (req: Request, res: Response): void => {
  if (!googleOAuthService.isConfigured()) {
    res.status(503).json(createErrorResponse('Google OAuth is not configured'));
    return;
  }

  console.log('[OAuth] Initiating Google OAuth authentication');

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false // We use JWT tokens, not sessions
  })(req, res);
};

export const handleGoogleCallback = (req: Request, res: Response): void => {
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

      // Process the authentication result
      const result = await authService.googleAuth(prisma, googleAuthResult);
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieOptions = getCookieOptions(isProduction);

      // Set secure HTTP-only cookies
      res.cookie('gb_accessToken', result.accessToken, {
        ...cookieOptions,
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('gb_refreshToken', result.refreshToken, {
        ...cookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      console.log(`[OAuth] Cookies set for Google OAuth user: ${result.user.email}`);

      // Redirect to frontend with success
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

export const getGoogleAuthStatus = async (req: Request, res: Response): Promise<void> => {
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

export const unlinkGoogleAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    // Get current user to check if they have a password
    const currentUser = await authService.getProfile(prisma, userId);

    if (!currentUser) {
      res.status(404).json(createErrorResponse('User not found'));
      return;
    }

    // Check if user has a password set - prevent unlinking if they don't have alternative login method
    const userWithPassword = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true, googleId: true }
    });

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

    console.log(`[OAuth] Google account unlinked for user: ${currentUser.email}`);

    res.json(createSuccessResponse('Google account unlinked successfully', null));
  } catch (error) {
    console.error('[OAuth] Error unlinking Google account:', error);
    res.status(500).json(createErrorResponse('Failed to unlink Google account', error instanceof Error ? error.message : 'Unknown error'));
  }
};