import { IRoomRepository } from '../../domain/IRoomRepository';
import { IRoomMemberRepository } from '../../domain/IRoomMemberRepository';
import { PrismaClient } from '@prisma/client';

export class LeaveRoomUseCase {
    constructor(
        private roomRepository: IRoomRepository,
        private roomMemberRepository: IRoomMemberRepository,
        private prisma: PrismaClient
    ) { }

    async execute(userId: string, roomId: string): Promise<void> {
        if (!userId) {
            throw new Error('Authentication required');
        }
        if (!roomId || typeof roomId !== 'string' || roomId.trim() === '') {
            throw new Error('Invalid room ID');
        }

        // Check if member
        const membership = await this.roomMemberRepository.findByUserAndRoom(userId, roomId);
        if (!membership) {
            throw new Error('Not a member of this room');
        }

        // Remove member
        await this.roomMemberRepository.deleteByUserAndRoom(userId, roomId);

        // Decrement member count
        await this.roomRepository.decrementMemberCount(roomId);

        // Check if the leaving user is the owner
        const room = await this.roomRepository.findById(roomId);
        if (room && room.createdById === userId) {
            // Find the next eligible member (prefer admin, then oldest member)
            const remainingMembers = await this.prisma.roomMember.findMany({
                where: { roomId },
                orderBy: [
                    { isAdmin: 'desc' },
                    { joinedAt: 'asc' }
                ],
                include: { user: true }
            });

            if (remainingMembers.length > 0 && remainingMembers[0]?.user) {
                // Transfer ownership to the next eligible member
                const newOwner = remainingMembers[0].user;
                await this.roomRepository.update(roomId, { createdById: newOwner.id } as any);
            }
            // If no members remain, do nothing (room will have no owner)
        }
    }
}
