import { IUserRepository } from '../../domain/IUserRepository';
import { User } from '../../domain/User';
import { UserQuery } from '../../../../types';

export class GetUsersUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(query: UserQuery): Promise<{ users: User[]; total: number }> {
        return await this.userRepository.findAll(query);
    }

    async executeWithActivity(query: UserQuery): Promise<{ users: User[]; total: number }> {
        return await this.userRepository.findAllWithActivity(query);
    }
}
