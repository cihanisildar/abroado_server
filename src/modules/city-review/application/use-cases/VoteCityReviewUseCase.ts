import { ICityReviewRepository } from '../../domain/ICityReviewRepository';

export class VoteCityReviewUseCase {
    constructor(private reviewRepository: ICityReviewRepository) { }

    async execute(userId: string, reviewId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        await this.reviewRepository.vote(userId, reviewId, type);
    }

    async removeVote(userId: string, reviewId: string): Promise<void> {
        await this.reviewRepository.removeVote(userId, reviewId);
    }
}
