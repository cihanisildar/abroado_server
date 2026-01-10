import { PrismaClient, Prisma } from '@prisma/client';
import { IUserRepository } from '../../domain/IUserRepository';
import { User } from '../../domain/User';
import { UserMapper } from './UserMapper';
import { UserQuery, UpdateUserDto } from '../../../../types';

export class PrismaUserRepository implements IUserRepository {
    constructor(private prisma: PrismaClient) { }

    async findAll(query: UserQuery): Promise<{ users: User[]; total: number }> {
        const { page = 1, limit = 20, search, city, countryOfOrigin, livingIn, role, sortBy = 'createdAt', sortOrder = 'desc' } = query as any;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const where: Prisma.UserWhereInput = {};

        if (search) {
            where.OR = [
                { username: { contains: search as string, mode: 'insensitive' } },
                { bio: { contains: search as string, mode: 'insensitive' } }
            ];
        }

        if (city) where.currentCity = { contains: city as string, mode: 'insensitive' };
        if (livingIn) where.currentCountry = { contains: livingIn as string, mode: 'insensitive' };

        if (role) where.role = role as any;

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take,
                orderBy: { [sortBy as string]: sortOrder as any }
            }),
            this.prisma.user.count({ where })
        ]);

        return {
            users: users.map(UserMapper.toDomain),
            total
        };
    }

    async findById(id: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });

        if (!user) return null;
        return UserMapper.toDomain(user);
    }

    async findByEmail(email: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { email }
        });

        if (!user) return null;
        return UserMapper.toDomain(user);
    }

    async update(id: string, data: UpdateUserDto): Promise<User> {
        const user = await this.prisma.user.update({
            where: { id },
            data: data as any
        });
        return UserMapper.toDomain(user);
    }

    async findAllWithActivity(query: UserQuery): Promise<{ users: User[]; total: number }> {
        const { page = 1, limit = 20 } = query;
        const skip = (Number(page) - 1) * Number(limit);
        const take = Number(limit);

        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where: {
                    lastSeen: { not: null }
                },
                skip,
                take,
                orderBy: { lastSeen: 'desc' }
            }),
            this.prisma.user.count({ where: { lastSeen: { not: null } } })
        ]);

        return {
            users: users.map(UserMapper.toDomain),
            total
        };
    }

    async findByGoogleId(googleId: string): Promise<User | null> {
        const user = await this.prisma.user.findUnique({
            where: { googleId }
        });

        if (!user) return null;
        return UserMapper.toDomain(user);
    }

    async create(data: any): Promise<User> {
        const user = await this.prisma.user.create({
            data: {
                username: data.username,
                email: data.email,
                password: data.password,
                role: data.role || 'EXPLORER',
                googleId: data.googleId || null
            }
        });
        return UserMapper.toDomain(user);
    }

    async updateOnlineStatus(id: string, isOnline: boolean): Promise<void> {
        await this.prisma.user.update({
            where: { id },
            data: {
                isOnline,
                lastSeen: new Date()
            }
        });
    }

    async linkGoogleAccount(id: string, googleId: string, avatar?: string): Promise<User> {
        const data: any = { googleId };
        if (avatar) {
            data.avatar = avatar;
        }
        const user = await this.prisma.user.update({
            where: { id },
            data
        });
        return UserMapper.toDomain(user);
    }
}
