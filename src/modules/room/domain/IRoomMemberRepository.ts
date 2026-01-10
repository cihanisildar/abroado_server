export interface IRoomMemberRepository {
    findByUserAndRoom(userId: string, roomId: string): Promise<any | null>;
    create(userId: string, roomId: string, isAdmin?: boolean): Promise<any>;
    deleteByUserAndRoom(userId: string, roomId: string): Promise<void>;
}
