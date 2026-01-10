import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { CityReview } from '../../domain/CityReview';

export class GetCityReviewsByUserUseCase {
    constructor(private cityReviewRepository: ICityReviewRepository) { }

    async execute(userId: string, query: any, currentUserId?: string): Promise<{ reviews: CityReview[]; total: number; pagination: any }> {
        const result = await this.cityReviewRepository.findByUserId(userId, query, currentUserId);

        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);

        return {
            reviews: result.reviews,
            total: result.total,
            pagination: {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            }
        };
    }
}
