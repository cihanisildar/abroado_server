import { ICityReviewRepository } from '../../domain/ICityReviewRepository';

export class DeleteCityReviewUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(userId: string, reviewId: string): Promise<void> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) throw new Error('Review not found');

        if (!review.canBeEditedBy(userId)) { // Reusing edit permission for delete
            throw new Error('Unauthorized');
        }

        await this.reviewRepository.delete(reviewId);
    }
}
