import { ICommentRepository } from '../../domain/ICommentRepository';


export class DeleteCommentUseCase {
    // Note: IPostRepository might not be needed if decrement logic is in CommentRepo or handled otherwise.
    // CommentRepo usually handles simple delete.
    constructor(private commentRepository: ICommentRepository) { }

    async execute(userId: string, commentId: string): Promise<void> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new Error('Comment not found');

        if (!comment.canBeEditedBy(userId)) {
            throw new Error('Unauthorized: You can only delete your own comments');
        }

        if (comment.content === '[deleted]') {
            throw new Error('Comment already deleted');
        }

        const wasHardDeleted = await this.commentRepository.delete(commentId);

        // Decrement post comments count if hard deleted?
        // Need access to PostRepo or CommentRepo should handle it?
        // Or ICommentRepository should have decrement method.
        if (wasHardDeleted) {
            await this.commentRepository.decrementPostCommentsCount(comment.postId);
        }
    }
}
