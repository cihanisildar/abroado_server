import { IRoomRepository } from '../../domain/IRoomRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';

export class JoinRoomUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private roomMemberRepository: IRoomMemberRepository
    ) { }

    async execute(userId: string, roomId: string): Promise<void> {
        if (!userId) {
            throw new Error('Authentication required');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        // Check if already a member
        const existingMember = await this.roomMemberRepository.findByUserAndRoom(userId, roomId);
        if (existingMember) {
            throw new Error('Already a member of this room');
        }

        // Add member
        await this.roomMemberRepository.create(userId, roomId);

        // Increment member count
        await this.roomRepository.incrementMemberCount(roomId);
    }
}
