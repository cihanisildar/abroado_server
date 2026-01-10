import { PrismaClient } from '@prisma/client';
import { IMessageRepository } from '../../domain/IMessageRepository';
import { Message } from '../../domain/Message';
import { MessageMapper } from './MessageMapper';

export class PrismaMessageRepository implements IMessageRepository {
    constructor(private prisma: PrismaClient) { }

    async findByRoomId(roomId: string, query: any): Promise<{ messages: Message[]; total: number; pagination: any }> {
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 50), 100);
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            this.prisma.message.findMany({
                where: { roomId },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            avatar: true,
                            role: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.message.count({ where: { roomId } })
        ]);

        return {
            messages: messages.reverse().map(m => MessageMapper.toDomain(m)),
            total,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        };
    }

    async create(userId: string, roomId: string, data: { content: string }): Promise<Message> {
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            throw new Error('Invalid user ID');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        const message = await this.prisma.message.create({
            data: {
                content: data.content,
                user: {
                    connect: { id: userId }
                },
                room: {
                    connect: { id: roomId }
                }
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

        return MessageMapper.toDomain(message);
    }

    async sendMessage(userId: string, roomId: string, data: { content: string }): Promise<Message> {
        return await this.create(userId, roomId, data);
    }
}
