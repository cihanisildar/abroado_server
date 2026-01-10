import { ICommentRepository } from '../../domain/ICommentRepository';
import { Comment } from '../../domain/Comment';

export class UpdateCommentUseCase {
    constructor(private commentRepository: ICommentRepository) { }

    async execute(userId: string, commentId: string, content: string): Promise<Comment> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new Error('Comment not found');

        if (!comment.canBeEditedBy(userId)) {
            throw new Error('Unauthorized: You can only edit your own comments');
        }

        if (comment.content === '[deleted]') {
            throw new Error('Cannot edit deleted comments');
        }

        return await this.commentRepository.update(commentId, content);
    }
}
