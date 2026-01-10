import jwt from 'jsonwebtoken';
import { jwtSecret, jwtRefreshSecret } from '../../../config/secrets';

export class TokenService {
    generateAccessToken(userId: string, email: string): string {
        return jwt.sign(
            { userId, email, type: 'access' },
            jwtSecret,
            { expiresIn: '15m' } as jwt.SignOptions
        );
    }

    generateRefreshToken(userId: string, email: string): string {
        if (!jwtRefreshSecret) {
            console.error('[Auth] JWT_REFRESH_SECRET is not configured - refresh tokens will not work');
            throw new Error('JWT_REFRESH_SECRET is not configured');
        }
        return jwt.sign(
            { userId, email, type: 'refresh' },
            jwtRefreshSecret,
            { expiresIn: '30d' }
        );
    }

    verifyAccessToken(token: string): { userId: string; email: string } {
        try {
            const decoded = jwt.verify(token, jwtSecret) as { userId: string; email: string; type: string };
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            console.error('[Auth] Access token verification failed:', error);
            throw new Error('Invalid access token');
        }
    }

    verifyRefreshToken(token: string): { userId: string; email: string } {
        try {
            if (!jwtRefreshSecret) {
                console.error('[Auth] JWT_REFRESH_SECRET is not configured');
                throw new Error('JWT_REFRESH_SECRET is not configured');
            }
            const decoded = jwt.verify(token, jwtRefreshSecret) as { userId: string; email: string; type: string };
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            return decoded;
        } catch (error) {
            console.error('[Auth] Refresh token verification failed:', error);
            throw new Error('Invalid refresh token');
        }
    }
}
