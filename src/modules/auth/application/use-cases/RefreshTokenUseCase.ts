import { IUserRepository } from '../../../user/domain/IUserRepository';
import { TokenService } from '../../infrastructure/TokenService';

export class RefreshTokenUseCase {
    constructor(
        private userRepository: IUserRepository,
        private tokenService: TokenService
    ) { }

    async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
        // Verify refresh token
        const decoded = this.tokenService.verifyRefreshToken(refreshToken);

        // Check if user still exists
        const user = await this.userRepository.findById(decoded.userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new tokens
        const newAccessToken = this.tokenService.generateAccessToken(user.id, user.email);
        const newRefreshToken = this.tokenService.generateRefreshToken(user.id, user.email);

        return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    }
}
