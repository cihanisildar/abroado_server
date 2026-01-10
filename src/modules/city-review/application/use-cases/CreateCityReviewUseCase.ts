import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { ICityRepository } from '../../../../modules/city/domain/ICityRepository';
import { CityReviewDto } from '../../../../types';
import { CityReview } from '../../domain/CityReview';

export class CreateCityReviewUseCase {
    constructor(
        private reviewRepository: ICityReviewRepository,
        private cityRepository: ICityRepository
    ) { }

    async execute(userId: string, cityId: string, data: Omit<CityReviewDto, 'cityName' | 'country'>): Promise<CityReview> {
        if (!userId) throw new Error('Authentication required');

        // Ensure city exists logic is likely handled by UI sending valid cityId, 
        // but in robust system we'd verify or ensure logic. 
        // Assuming cityId is valid UUID from database for reviews (user selects existing city or ensures it first).

        // Check if city exists in DB
        const city = await this.cityRepository.findById(cityId);
        if (!city) {
            // Should we use ensureCityExistsUseCase? 
            // For reviews, usually we review *existing* cities in our system or create them.
            // Let's assume strict checking for now.
            throw new Error('City not found');
        }

        // Check if user already reviewed this city? (Optional rule)

        return await this.reviewRepository.create(userId, cityId, data);
    }
}
