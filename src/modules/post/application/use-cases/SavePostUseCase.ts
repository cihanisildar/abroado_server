import { IPostRepository } from '../../domain/IPostRepository';

export class SavePostUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(userId: string, postId: string): Promise<void> {
        if (!userId) throw new Error('Authentication required');
        if (!postId) throw new Error('Post ID is required');

        // Check if post exists
        const post = await this.postRepository.findById(postId);
        if (!post) throw new Error('Post not found');

        try {
            await this.postRepository.save(userId, postId);
        } catch (error) {
            if (error instanceof Error && error.message.includes('unique constraint')) {
                throw new Error('Post already saved');
            }
            throw error;
        }
    }

    async unsave(userId: string, postId: string): Promise<void> {
        if (!userId) throw new Error('Authentication required');
        if (!postId) throw new Error('Post ID is required');

        await this.postRepository.unsave(userId, postId);
    }
}
