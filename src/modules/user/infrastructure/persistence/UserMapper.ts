import { User } from '../../domain/User';

export class UserMapper {
    public static toDomain(prismaUser: any): User {
        return new User({
            id: prismaUser.id,
            email: prismaUser.email,
            username: prismaUser.username,
            avatar: prismaUser.avatar || null,
            role: prismaUser.role,
            currentCity: prismaUser.currentCity || null,
            currentCountry: prismaUser.currentCountry || null,
            targetCountry: prismaUser.targetCountry || null,
            bio: prismaUser.bio || null,
            techStack: prismaUser.techStack || [],
            isOnline: prismaUser.isOnline || false,
            lastSeen: prismaUser.lastSeen || null,
            googleId: prismaUser.googleId || null,
            createdAt: prismaUser.createdAt,
            updatedAt: prismaUser.updatedAt
        });
    }
}
