import { IUserRepository } from '../../domain/IUserRepository';
import * as s3Service from '../../../../shared/infrastructure/S3Service';
import { User } from '../../domain/User';

export class UploadAvatarUseCase {
    constructor(private userRepository: IUserRepository) { }

    async execute(userId: string, targetUserId: string, fileBuffer: Buffer, mimeType: string): Promise<User> {
        if (userId !== targetUserId) {
            throw new Error('Permission denied: You can only upload your own avatar');
        }

        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error('User not found');

        const oldAvatarUrl = user.avatar;

        // Upload new avatar
        const avatarUrl = await s3Service.uploadAvatar(fileBuffer, mimeType, userId);

        // Update user
        const updatedUser = await this.userRepository.update(userId, { avatar: avatarUrl });

        // Cleanup old avatar
        if (oldAvatarUrl && oldAvatarUrl.includes('s3') && oldAvatarUrl.includes('amazonaws.com')) {
            try {
                await s3Service.deleteAvatar(oldAvatarUrl);
            } catch (e) {
                console.error('Failed to delete old avatar', e);
            }
        }

        return updatedUser;
    }
}
