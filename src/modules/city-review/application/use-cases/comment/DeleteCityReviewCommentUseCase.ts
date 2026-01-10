import { ICityReviewCommentRepository } from '../../../domain/ICityReviewCommentRepository';
import { ICityReviewRepository } from '../../../domain/ICityReviewRepository';

export class DeleteCityReviewCommentUseCase {
    constructor(
        private commentRepository: ICityReviewCommentRepository,
        private reviewRepository: ICityReviewRepository
    ) { }

    async execute(userId: string, commentId: string): Promise<void> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new Error('City review comment not found');

        if (!comment.canBeEditedBy(userId)) {
            throw new Error('Unauthorized: You can only delete your own comments');
        }

        if (comment.content === '[deleted]') {
            throw new Error('Comment already deleted');
        }

        const wasHardDeleted = await this.commentRepository.delete(commentId);

        if (wasHardDeleted) {
            await this.commentRepository.decrementCommentsCount(comment.cityReviewId);
        }
    }
}
