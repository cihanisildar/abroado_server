import { Room as PrismaRoom } from '@prisma/client';
import { Room } from '../../domain/Room';

export class RoomMapper {
    static toDomain(prismaRoom: any): Room {
        return new Room({
            id: prismaRoom.id,
            name: prismaRoom.name,
            description: prismaRoom.description,
            type: prismaRoom.type,
            country: prismaRoom.country,
            isPublic: prismaRoom.isPublic,
            maxMembers: prismaRoom.maxMembers,
            memberCount: prismaRoom.memberCount,
            createdById: prismaRoom.createdById,
            createdAt: prismaRoom.createdAt,
            updatedAt: prismaRoom.updatedAt,
            members: prismaRoom.members
        });
    }
}
