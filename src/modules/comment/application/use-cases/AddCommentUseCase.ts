import { ICommentRepository } from '../../domain/ICommentRepository';
import { IPostRepository } from '../../../../modules/post/domain/IPostRepository';
import { CommentDto } from '../../../../types';
import { Comment } from '../../domain/Comment';

export class AddCommentUseCase {
    constructor(
        private commentRepository: ICommentRepository,
        private postRepository: IPostRepository
    ) { }

    async execute(userId: string, postId: string, data: CommentDto): Promise<Comment> {
        if (!userId) throw new Error('Authentication required');

        // Check if post exists
        const post = await this.postRepository.findById(postId);
        if (!post) throw new Error('Post not found');

        const comment = await this.commentRepository.create(userId, postId, data);

        // Side effect: increment post comment count
        await this.postRepository.incrementCommentsCount(postId);

        return comment;
    }
}
