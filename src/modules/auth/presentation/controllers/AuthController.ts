import { Request, Response, CookieOptions } from 'express';
import { RegisterUseCase } from '../../application/use-cases/RegisterUseCase';
import { LoginUseCase } from '../../application/use-cases/LoginUseCase';
import { LogoutUseCase } from '../../application/use-cases/LogoutUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/RefreshTokenUseCase';
import { GetProfileUseCase } from '../../application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from '../../application/use-cases/UpdateProfileUseCase';
import { GoogleAuthUseCase } from '../../application/use-cases/GoogleAuthUseCase';
import { getAuthenticatedUserId } from '../../../../utils/authHelpers';
import * as s3Service from '../../../../shared/infrastructure/S3Service';
import {
    createSuccessResponse,
    createErrorResponse,
    RegisterSchema,
    LoginSchema,
    UpdateProfileSchema,
    validateRequest
} from '../../../../types';

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

export class AuthController {
    constructor(
        private registerUseCase: RegisterUseCase,
        private loginUseCase: LoginUseCase,
        private logoutUseCase: LogoutUseCase,
        private refreshTokenUseCase: RefreshTokenUseCase,
        private getProfileUseCase: GetProfileUseCase,
        private updateProfileUseCase: UpdateProfileUseCase,
        private googleAuthUseCase: GoogleAuthUseCase
    ) { }

    public register = async (req: Request, res: Response): Promise<void> => {
        try {
            const validation = validateRequest(RegisterSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const result = await this.registerUseCase.execute(validation.data);
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

            console.log(`[Auth] User registered successfully: ${result.user.email}`);

            res.status(201).json(createSuccessResponse('User registered successfully', {
                user: result.user
            }));
        } catch (error) {
            console.error('[Auth] Registration failed:', error);
            res.status(400).json(createErrorResponse('Registration failed', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public login = async (req: Request, res: Response): Promise<void> => {
        try {
            const validation = validateRequest(LoginSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const result = await this.loginUseCase.execute(validation.data);
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

            console.log(`[Auth] User logged in successfully: ${result.user.email}`);
            console.log(`[Auth] Cookies set with options:`, {
                secure: cookieOptions.secure,
                sameSite: cookieOptions.sameSite,
                domain: cookieOptions.domain || 'not set',
                httpOnly: cookieOptions.httpOnly
            });

            res.json(createSuccessResponse('Login successful', {
                user: result.user
            }));
        } catch (error) {
            console.error('[Auth] Login failed:', error);
            res.status(401).json(createErrorResponse('Login failed', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public refresh = async (req: Request, res: Response): Promise<void> => {
        try {
            const refreshToken = req.cookies?.gb_refreshToken;

            if (!refreshToken) {
                res.status(401).json(createErrorResponse('Refresh token required'));
                return;
            }

            const result = await this.refreshTokenUseCase.execute(refreshToken);
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

            res.json(createSuccessResponse('Tokens refreshed successfully', null));
        } catch (error) {
            const isProduction = process.env.NODE_ENV === 'production';
            const cookieOptions = getCookieOptions(isProduction);

            res.clearCookie('gb_refreshToken', cookieOptions);
            res.clearCookie('gb_accessToken', cookieOptions);

            res.status(401).json(createErrorResponse('Invalid refresh token', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public logout = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            await this.logoutUseCase.execute(userId);

            const isProduction = process.env.NODE_ENV === 'production';
            const cookieOptions = getCookieOptions(isProduction);

            res.clearCookie('gb_accessToken', cookieOptions);
            res.clearCookie('gb_refreshToken', cookieOptions);

            res.json(createSuccessResponse('Logout successful', null));
        } catch (error) {
            res.status(500).json(createErrorResponse('Logout failed', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const user = await this.getProfileUseCase.execute(getAuthenticatedUserId(req));

            res.json(createSuccessResponse('Profile retrieved successfully', user));
        } catch (error) {
            if (error instanceof Error && error.message === 'User not found') {
                res.status(404).json(createErrorResponse('User not found'));
                return;
            }
            res.status(500).json(createErrorResponse('Failed to get profile', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public updateProfile = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);

            const validation = validateRequest(UpdateProfileSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const updateData: any = { ...validation.data };

            let oldAvatarUrl: string | null = null;
            if (req.file) {
                const currentUser = await this.getProfileUseCase.execute(userId);
                oldAvatarUrl = currentUser.avatar ?? null;

                const avatarUrl = await s3Service.uploadAvatar(
                    req.file.buffer,
                    req.file.mimetype,
                    userId,
                );
                updateData.avatar = avatarUrl;
            }

            const user = await this.updateProfileUseCase.execute(userId, updateData);

            if (req.file && oldAvatarUrl && oldAvatarUrl.includes('s3.') && oldAvatarUrl.includes('amazonaws.com')) {
                try {
                    await s3Service.deleteAvatar(oldAvatarUrl);
                } catch (deleteError) {
                    console.error('Failed to delete old avatar:', deleteError);
                }
            }

            res.json(createSuccessResponse('Profile updated successfully', user));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to update profile', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // This method will be called from Google OAuth controller
    public async processGoogleAuth(googleAuthResult: { user: any; isNewUser: boolean }): Promise<{ user: any; accessToken: string; refreshToken: string; isNewUser: boolean }> {
        return await this.googleAuthUseCase.execute(googleAuthResult);
    }
}
