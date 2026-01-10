import { IUserRepository } from '../../domain/IUserRepository';
import { User } from '../../domain/User';

export class GetUserByIdUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(id: string): Promise<User | null> {
        return await this.userRepository.findById(id);
    }
}
