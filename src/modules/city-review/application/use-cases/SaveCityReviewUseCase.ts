import { ICityReviewRepository } from '../../domain/ICityReviewRepository';

export class SaveCityReviewUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(userId: string, reviewId: string): Promise<void> {
        await this.reviewRepository.save(userId, reviewId);
    }

    async unsave(userId: string, reviewId: string): Promise<void> {
        await this.reviewRepository.unsave(userId, reviewId);
    }
}
