import { Message } from './Message';

export interface IMessageRepository {
    findByRoomId(roomId: string, query: any): Promise<{ messages: Message[]; total: number; pagination: any }>;
    create(userId: string, roomId: string, data: { content: string }): Promise<Message>;
    sendMessage(userId: string, roomId: string, data: { content: string }): Promise<Message>;
}
