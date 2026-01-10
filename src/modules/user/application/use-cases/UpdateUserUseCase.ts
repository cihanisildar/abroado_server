import { IUserRepository } from '../../domain/IUserRepository';
import { User } from '../../domain/User';
import { UpdateUserDto } from '../../../../types';

export class UpdateUserUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: string, targetUserId: string, data: UpdateUserDto): Promise<User> {
        if (userId !== targetUserId) {
            throw new Error('Permission denied: You can only update your own profile');
        }

        const user = await this.userRepository.findById(targetUserId);
        if (!user) throw new Error('User not found');

        return await this.userRepository.update(targetUserId, data);
    }
}
