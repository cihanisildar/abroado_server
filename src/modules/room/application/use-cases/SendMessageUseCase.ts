import { IMessageRepository } from '../../domain/IMessageRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';
import { Message } from '../../domain/Message';

export class SendMessageUseCase {
    constructor(
        private messageRepository: IMessageRepository,
        private roomMemberRepository: IRoomMemberRepository
    ) { }

    async execute(userId: string, roomId: string, content: string): Promise<Message> {
        if (!userId) {
            throw new Error('Authentication required');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        // Check if user is a member
        const membership = await this.roomMemberRepository.findByUserAndRoom(userId, roomId);
        if (!membership) {
            throw new Error('You are not a member of this room');
        }

        return await this.messageRepository.sendMessage(userId, roomId, { content });
    }
}
