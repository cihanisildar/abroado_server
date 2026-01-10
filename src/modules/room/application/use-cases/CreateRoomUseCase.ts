import { IRoomRepository } from '../../domain/IRoomRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';
import { Room } from '../../domain/Room';
import { RoomDto } from '../../../../types';

export class CreateRoomUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private roomMemberRepository: IRoomMemberRepository
    ) { }

    async execute(userId: string, roomData: RoomDto): Promise<Room> {
        if (!userId) {
            throw new Error('Authentication required');
        }

        // Create room
        const room = await this.roomRepository.create(userId, roomData);

        // Add creator as admin member
        await this.roomMemberRepository.create(userId, room.id, true);

        // Increment member count
        await this.roomRepository.incrementMemberCount(room.id);

        return room;
    }
}
