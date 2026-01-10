import { Message as PrismaMessage } from '@prisma/client';
import { Message } from '../../domain/Message';

export class MessageMapper {
    static toDomain(prismaMessage: any): Message {
        return new Message({
            id: prismaMessage.id,
            userId: prismaMessage.userId,
            roomId: prismaMessage.roomId,
            content: prismaMessage.content,
            createdAt: prismaMessage.createdAt,
            user: prismaMessage.user
        });
    }
}
