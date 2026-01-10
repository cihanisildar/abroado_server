import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { RegisterDto, UserResponse } from '../../../../types';
import { IUserRepository } from '../../../user/domain/IUserRepository';
import { bcryptRounds } from '../../../../config/secrets';
import { TokenService } from '../../infrastructure/TokenService';

export class RegisterUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenService: TokenService
    ) { }

    async execute(userData: RegisterDto): Promise<{ user: UserResponse; accessToken: string; refreshToken: string }> {
        console.log(`[Auth] Attempting to register user: ${userData.email}`);

        // Check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email);

        if (existingUser) {
            console.log(`[Auth] Registration failed - user already exists: ${userData.email}`);
            throw new Error('Registration failed. Please check your information and try again.');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, bcryptRounds);

        // Create user
        const user = await this.userRepository.create({
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role
        });

        console.log(`[Auth] User created successfully: ${user.email}`);

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
        const refreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

        console.log(`[Auth] Tokens generated successfully for user: ${user.email}`);

        // Transform user data to match UserResponse type
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

        return { user: userResponse, accessToken, refreshToken };
    }
}

