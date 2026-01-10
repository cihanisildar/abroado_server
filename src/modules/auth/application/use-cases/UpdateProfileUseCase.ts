import { PrismaClient } from '@prisma/client';
import { UserResponse } from '../../../../types';

export class UpdateProfileUseCase {
    constructor(private prisma: PrismaClient) { }

    async execute(userId: string, updateData: any): Promise<UserResponse> {
        // Define allowed fields that can be updated
        const allowedFields = [
            'username',
            'currentCity',
            'currentCountry',
            'targetCountry',
            'techStack',
            'bio',
            'avatar'
        ];

        // Filter updateData to only include allowed fields that exist in the schema
        const filteredData: any = {};

        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        }

        // If no valid fields to update, throw an error
        if (Object.keys(filteredData).length === 0) {
            throw new Error('No valid fields provided for update');
        }

        const user = await this.prisma.user.update({
            where: { id: userId },
            data: filteredData,
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

        // Transform techStack for response
        const userResponse: UserResponse = {
            ...user,
            techStack: Array.isArray(user.techStack) ? JSON.stringify(user.techStack) : null
        };

        return userResponse;
    }
}

