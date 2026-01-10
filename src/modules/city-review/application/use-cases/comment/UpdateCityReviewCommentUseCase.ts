import { ICityReviewCommentRepository } from '../../../domain/ICityReviewCommentRepository';
import { CityReviewComment } from '../../../domain/CityReviewComment';

export class UpdateCityReviewCommentUseCase {
    constructor(private commentRepository: ICityReviewCommentRepository) { }

    async execute(userId: string, commentId: string, content: string): Promise<CityReviewComment> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new Error('City review comment not found');

        if (!comment.canBeEditedBy(userId)) {
            throw new Error('Unauthorized: You can only edit your own comments');
        }

        if (comment.content === '[deleted]') {
            throw new Error('Cannot edit deleted comments');
        }

        return await this.commentRepository.update(commentId, content);
    }
}
