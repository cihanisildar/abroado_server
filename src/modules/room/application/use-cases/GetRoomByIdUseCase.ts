import { IRoomRepository } from '../../domain/IRoomRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';
import { Room } from '../../domain/Room';

export class GetRoomByIdUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private roomMemberRepository: IRoomMemberRepository
    ) { }

    async execute(roomId: string, userId?: string): Promise<any> {
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        const room = await this.roomRepository.findById(roomId);

        if (!room) {
            throw new Error('Room not found');
        }

        // If userId provided, check if user is a member
        let isMember = false;
        if (userId) {
            const membership = await this.roomMemberRepository.findByUserAndRoom(userId, roomId);
            isMember = !!membership;
        }

        // Note: onlineMembers would need Socket service integration
        // This is handled at the controller/service level with SocketService

        return {
            ...room.toJSON(),
            isMember,
            onlineMembers: [] // Placeholder - will be populated by controller if needed
        };
    }
}
