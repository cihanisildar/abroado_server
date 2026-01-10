import { IPostRepository } from '../../domain/IPostRepository';
import { PostDto } from '../../../../types';
import { Post } from '../../domain/Post';
import { EnsureCityExistsUseCase } from '../../../city/application/use-cases/EnsureCityExistsUseCase';

export class CreatePostUseCase {
    constructor(
        private postRepository: IPostRepository,
        private ensureCityExistsUseCase: EnsureCityExistsUseCase
    ) { }

    async execute(userId: string, postData: PostDto): Promise<Post> {
        if (!userId) throw new Error('Authentication required');

        // Ensure city exists if provided
        if (postData.cityId) {
            await this.ensureCityExistsUseCase.execute(postData.cityId);
        }

        return await this.postRepository.create(userId, postData);
    }
}
