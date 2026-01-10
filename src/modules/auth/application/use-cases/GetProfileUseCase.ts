import { PrismaClient } from '@prisma/client';
import { UserResponse } from '../../../../types';

export class GetProfileUseCase {
    constructor(private prisma: PrismaClient) { }

    async execute(userId: string): Promise<UserResponse> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                currentCity: true,
                currentCountry: true,
                targetCountry: true,
                techStack: true,
                bio: true,
                avatar: true,
                isOnline: true,
                lastSeen: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Transform techStack for response
        const userResponse: UserResponse = {
            ...user,
            techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null
        };

        return userResponse;
    }
}

