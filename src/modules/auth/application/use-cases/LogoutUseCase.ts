import { IUserRepository } from '../../../user/domain/IUserRepository';

export class LogoutUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: string): Promise<void> {
        await this.userRepository.updateOnlineStatus(userId, false);
    }
}
