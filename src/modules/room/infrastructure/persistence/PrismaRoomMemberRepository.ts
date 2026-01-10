import { PrismaClient } from '@prisma/client';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';

export class PrismaRoomMemberRepository implements IRoomMemberRepository {
    constructor(private prisma: PrismaClient) { }

    async findByUserAndRoom(userId: string, roomId: string): Promise<any | null> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        return await this.prisma.roomMember.findUnique({
            where: {
                userId_roomId: { userId, roomId }
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        role: true,
                        isOnline: true,
                        lastSeen: true
                    }
                },
                room: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        isPublic: true
                    }
                }
            }
        });
    }

    async create(userId: string, roomId: string, isAdmin: boolean = false): Promise<any> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        return await this.prisma.roomMember.create({
            data: {
                user: {
                    connect: { id: userId }
                },
                room: {
                    connect: { id: roomId }
                },
                isAdmin
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                        role: true
                    }
                }
            }
        });
    }

    async deleteByUserAndRoom(userId: string, roomId: string): Promise<void> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        await this.prisma.roomMember.delete({
            where: {
                userId_roomId: { userId, roomId }
            }
        });
    }
}
