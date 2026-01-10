import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { CityReview } from '../../domain/CityReview';

export class GetCityReviewByIdUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(id: string, userId?: string): Promise<CityReview | null> {
        return await this.reviewRepository.findById(id, userId);
    }
}
