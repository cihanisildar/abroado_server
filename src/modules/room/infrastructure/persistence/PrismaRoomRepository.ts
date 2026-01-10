import { PrismaClient } from '@prisma/client';
import { IRoomRepository } from '../../domain/IRoomRepository';
import { Room } from '../../domain/Room';
import { RoomMapper } from './RoomMapper';
import { RoomQuery, RoomDto } from '../../../../types';

export class PrismaRoomRepository implements IRoomRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<Room | null> {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid room ID');
        }

        const room = await this.prisma.room.findUnique({
            where: { id },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        members: true,
                        messages: true
                    }
                }
            }
        });

        if (!room) return null;
        return RoomMapper.toDomain(room);
    }

    async findMany(query: RoomQuery): Promise<{ rooms: Room[]; total: number; pagination: any }> {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {
            isPublic: true
        };

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        if (query.type) {
            where.type = query.type;
        }

        if (query.country) {
            where.country = { contains: query.country, mode: 'insensitive' };
        }

        const [rooms, total] = await Promise.all([
            this.prisma.room.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            role: true
                        }
                    },
                    _count: {
                        select: {
                            members: true,
                            messages: true
                        }
                    }
                },
                orderBy: [
                    { memberCount: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            this.prisma.room.count({ where })
        ]);

        return {
            rooms: rooms.map(r => RoomMapper.toDomain(r)),
            total,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async findManyWithMembersAndMessages(query: RoomQuery): Promise<{ rooms: any[]; total: number; pagination: any }> {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {
            isPublic: true
        };

        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } }
            ];
        }

        if (query.type) {
            where.type = query.type;
        }

        if (query.country) {
            where.country = { contains: query.country, mode: 'insensitive' };
        }

        const [rooms, total] = await Promise.all([
            this.prisma.room.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            username: true,
                            role: true,
                            avatar: true
                        }
                    },
                    members: {
                        take: 5,
                        orderBy: [
                            { isAdmin: 'desc' },
                            { joinedAt: 'asc' }
                        ],
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true,
                                    role: true,
                                    isOnline: true
                                }
                            }
                        }
                    },
                    messages: {
                        take: 3,
                        orderBy: { createdAt: 'desc' },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    username: true,
                                    avatar: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            members: true,
                            messages: true
                        }
                    }
                },
                orderBy: [
                    { memberCount: 'desc' },
                    { createdAt: 'desc' }
                ],
                skip,
                take: limit
            }),
            this.prisma.room.count({ where })
        ]);

        const transformedRooms = rooms.map(room => ({
            ...room,
            hasMoreMembers: room._count.members > room.members.length,
            hasMoreMessages: room._count.messages > room.messages.length,
            lastMessage: room.messages[0] || null
        }));

        return {
            rooms: transformedRooms,
            total,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async create(userId: string, data: RoomDto): Promise<Room> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }

        const room = await this.prisma.room.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                type: data.type as any,
                country: data.country ?? null,
                isPublic: data.isPublic ?? true,
                maxMembers: data.maxMembers ?? 100,
                createdBy: {
                    connect: { id: userId }
                }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        return RoomMapper.toDomain(room);
    }

    async update(id: string, data: Partial<RoomDto>): Promise<Room> {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid room ID');
        }

        const room = await this.prisma.room.update({
            where: { id },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.type && { type: data.type as any }),
                ...(data.country !== undefined && { country: data.country }),
                ...(data.isPublic !== undefined && { isPublic: data.isPublic }),
                ...(data.maxMembers && { maxMembers: data.maxMembers }),
                ...(data as any).createdById && { createdById: (data as any).createdById }
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });

        return RoomMapper.toDomain(room);
    }

    async incrementMemberCount(id: string): Promise<void> {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid room ID');
        }

        await this.prisma.room.update({
            where: { id },
            data: {
                memberCount: {
                    increment: 1
                }
            }
        });
    }

    async decrementMemberCount(id: string): Promise<void> {
        if (!id || typeof id !== 'string' || id.trim() === '') {
            throw new Error('Invalid room ID');
        }

        await this.prisma.room.update({
            where: { id },
            data: {
                memberCount: {
                    decrement: 1
                }
            }
        });
    }

    async getCountriesStats(): Promise<{ country: string; count: number }[]> {
        const rooms = await this.prisma.room.findMany({
            where: { country: { not: null } },
            select: { country: true }
        });

        const map = new Map<string, number>();
        rooms.forEach(r => {
            const country = r.country as string | null;
            if (country) {
                map.set(country, (map.get(country) || 0) + 1);
            }
        });

        return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
    }
}
