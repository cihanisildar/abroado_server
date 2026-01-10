import { IPostRepository } from '../../domain/IPostRepository';

export class VotePostUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(userId: string, postId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        if (!userId) throw new Error('Authentication required');
        if (!postId) throw new Error('Post ID is required');

        // Check if post exists
        const post = await this.postRepository.findById(postId);
        if (!post) throw new Error('Post not found');

        await this.postRepository.vote(userId, postId, type);
    }

    async removeVote(userId: string, postId: string): Promise<void> {
        if (!userId) throw new Error('Authentication required');
        if (!postId) throw new Error('Post ID is required');

        await this.postRepository.removeVote(userId, postId);
    }
}
