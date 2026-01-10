import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { UpdateCityReviewDto } from '../../../../types';
import { CityReview } from '../../domain/CityReview';

export class UpdateCityReviewUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(userId: string, reviewId: string, data: Partial<UpdateCityReviewDto>): Promise<CityReview> {
        const review = await this.reviewRepository.findById(reviewId);
        if (!review) throw new Error('Review not found');

        if (!review.canBeEditedBy(userId)) {
            throw new Error('Unauthorized');
        }

        return await this.reviewRepository.update(reviewId, data);
    }
}
