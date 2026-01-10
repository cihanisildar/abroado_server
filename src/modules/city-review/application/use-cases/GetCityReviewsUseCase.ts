import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { CityReview } from '../../domain/CityReview';
import { CityReviewQuery } from '../../../../types';

export class GetCityReviewsUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(query: CityReviewQuery, userId?: string): Promise<{ reviews: CityReview[]; total: number }> {
        if (query.cityId) {
            return await this.reviewRepository.findByCityId(query.cityId, query, userId);
        }
        if (query.userId) { // If getting reviews BY a user
            return await this.reviewRepository.findByUserId(query.userId, query, userId);
        }
        return await this.reviewRepository.findAll(query, userId);
    }
}
