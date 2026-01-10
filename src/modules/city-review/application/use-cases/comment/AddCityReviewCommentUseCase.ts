import { ICityReviewRepository } from '../../../domain/ICityReviewRepository';
import { ICityReviewCommentRepository } from '../../../domain/ICityReviewCommentRepository';
import { CommentDto } from '../../../../../types';
import { CityReviewComment } from '../../../domain/CityReviewComment';

export class AddCityReviewCommentUseCase {
    constructor(
        private commentRepository: ICityReviewCommentRepository,
        private reviewRepository: ICityReviewRepository
    ) { }

    async execute(userId: string, cityReviewId: string, data: CommentDto): Promise<CityReviewComment> {
        if (!userId) throw new Error('Authentication required');

        const review = await this.reviewRepository.findById(cityReviewId);
        if (!review) throw new Error('City review not found');

        const comment = await this.commentRepository.create(userId, cityReviewId, data);

        await this.commentRepository.incrementCommentsCount(cityReviewId);

        return comment;
    }
}
