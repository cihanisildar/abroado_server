import { ICityReviewRepository } from '../../domain/ICityReviewRepository';

export class GetReviewCountriesStatsUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(): Promise<{ country: string; count: number }[]> {
        return await this.reviewRepository.getCountriesStats();
    }
}
