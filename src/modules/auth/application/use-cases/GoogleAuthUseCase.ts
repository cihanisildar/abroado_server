import { UserResponse } from '../../../../types';
import { IUserRepository } from '../../../user/domain/IUserRepository';
import { TokenService } from '../../infrastructure/TokenService';

export class GoogleAuthUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenService: TokenService
    ) { }

    async execute(googleAuthResult: { user: UserResponse; isNewUser: boolean }): Promise<{ user: UserResponse; accessToken: string; refreshToken: string; isNewUser: boolean }> {
        const { user, isNewUser } = googleAuthResult;

        console.log(`[Auth] Processing Google OAuth for user: ${user.email}`);

        // Update online status
        await this.userRepository.updateOnlineStatus(user.id, true);

        // Generate tokens
        const accessToken = this.tokenService.generateAccessToken(user.id, user.email);
        const refreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

        console.log(`[Auth] Google OAuth tokens generated successfully for user: ${user.email}`);

        return {
            user,
            accessToken,
            refreshToken,
            isNewUser
        };
    }
}
