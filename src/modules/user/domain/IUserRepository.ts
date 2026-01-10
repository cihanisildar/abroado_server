import { User } from './User';
import { UserQuery, UpdateUserDto } from '../../../types';

export interface IUserRepository {
    findAll(query: UserQuery): Promise<{ users: User[]; total: number }>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findByGoogleId(googleId: string): Promise<User | null>;
    create(data: any): Promise<User>;
    update(id: string, data: UpdateUserDto): Promise<User>;
    updateOnlineStatus(id: string, isOnline: boolean): Promise<void>;
    linkGoogleAccount(id: string, googleId: string, avatar?: string): Promise<User>;
    findAllWithActivity(query: UserQuery): Promise<{ users: User[]; total: number }>;
}
