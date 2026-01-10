import { IPostRepository } from '../../domain/IPostRepository';

export class DeletePostUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(userId: string, postId: string): Promise<void> {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new Error('Post not found');

        if (!post.canBeDeletedBy(userId)) {
            throw new Error('Unauthorized: You can only delete your own posts');
        }

        await this.postRepository.delete(postId);
    }
}
