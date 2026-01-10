import bcrypt from 'bcryptjs';
import { LoginDto, UserResponse } from '../../../../types';
import { IUserRepository } from '../../../user/domain/IUserRepository';
import { TokenService } from '../../infrastructure/TokenService';

export class LoginUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenService: TokenService
    ) { }

    async execute(loginData: LoginDto): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
        console.log(`[Auth] Attempting to login user: ${loginData.email}`);

        // Find user by email
        const user = await this.userRepository.findByEmail(loginData.email);

        if (!user) {
            console.log(`[Auth] Login failed - user not found: ${loginData.email}`);
            throw new Error('Invalid email or password');
        }

        // Check password
        if (!user.password) {
            console.log(`[Auth] Login failed - no password set for user: ${loginData.email}`);
            throw new Error('Please use Google OAuth to login');
        }

        const isValidPassword = await bcrypt.compare(loginData.password, user.password);
        if (!isValidPassword) {
            console.log(`[Auth] Login failed - invalid password for user: ${loginData.email}`);
            throw new Error('Invalid email or password');
        }

        // Update online status
        await this.userRepository.updateOnlineStatus(user.id, true);

        // Transform to UserResponse
        const userResponse: UserResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            currentCity: user.currentCity ?? null,
            currentCountry: user.currentCountry ?? null,
            targetCountry: user.targetCountry ?? null,
            techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null,
            bio: user.bio ?? null,
            avatar: user.avatar ?? null,
            isOnline: user.isOnline,
            lastSeen: user.lastSeen ?? null,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        console.log(`[Auth] User authenticated successfully: ${user.email}`);

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
        const refreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

        console.log(`[Auth] Tokens generated successfully for user: ${user.email}`);

        return { user: userResponse, accessToken, refreshToken };
    }
}
