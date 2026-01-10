import { Room } from './Room';
import { RoomQuery, RoomDto } from '../../../types';

export interface IRoomRepository {
    findById(id: string): Promise<Room | null>;
    findMany(query: RoomQuery): Promise<{ rooms: Room[]; total: number; pagination: any }>;
    findManyWithMembersAndMessages(query: RoomQuery): Promise<{ rooms: any[]; total: number; pagination: any }>;
    create(userId: string, data: RoomDto): Promise<Room>;
    update(id: string, data: Partial<RoomDto>): Promise<Room>;
    incrementMemberCount(id: string): Promise<void>;
    decrementMemberCount(id: string): Promise<void>;
    getCountriesStats(): Promise<{ country: string; count: number }[]>;
}
