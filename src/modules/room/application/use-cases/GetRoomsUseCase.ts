import { IRoomRepository } from '../../domain/IRoomRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';
import { RoomQuery } from '../../../../types';

export class GetRoomsUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private roomMemberRepository: IRoomMemberRepository
    ) { }

    async execute(query: RoomQuery, userId?: string): Promise<{ rooms: any[]; total: number; pagination: any }> {
        const result = await this.roomRepository.findMany(query);

        // If userId provided, check membership for all rooms at once (optimized)
        if (userId) {
            const roomIds = result.rooms.map(room => room.id);
            const memberships = await Promise.all(
                roomIds.map(roomId => this.roomMemberRepository.findByUserAndRoom(userId, roomId))
            );

            const memberRoomIds = new Set(
                memberships.filter(m => m !== null).map(m => m!.roomId)
            );

            const roomsWithMembership = result.rooms.map(room => ({
                ...room.toJSON(),
                isMember: memberRoomIds.has(room.id)
            }));

            return {
                ...result,
                rooms: roomsWithMembership
            };
        }

        // If no userId, add isMember: false for all rooms
        return {
            ...result,
            rooms: result.rooms.map(room => ({
                ...room.toJSON(),
                isMember: false
            }))
        };
    }

    async executeWithMembersAndMessages(query: RoomQuery, userId?: string): Promise<{ rooms: any[]; total: number; pagination: any }> {
        const result = await this.roomRepository.findManyWithMembersAndMessages(query);

        // If userId provided, check membership for all rooms at once (optimized)
        if (userId) {
            const roomIds = result.rooms.map(room => room.id);
            const memberships = await Promise.all(
                roomIds.map(roomId => this.roomMemberRepository.findByUserAndRoom(userId, roomId))
            );

            const memberRoomIds = new Set(
                memberships.filter(m => m !== null).map(m => m!.roomId)
            );

            const roomsWithMembership = result.rooms.map(room => ({
                ...room,
                isMember: memberRoomIds.has(room.id)
            }));

            return {
                ...result,
                rooms: roomsWithMembership
            };
        }

        // If no userId, add isMember: false for all rooms
        return {
            ...result,
            rooms: result.rooms.map(room => ({
                ...room,
                isMember: false
            }))
        };
    }
}
