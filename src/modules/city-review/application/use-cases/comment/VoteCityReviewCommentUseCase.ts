import { ICityReviewCommentRepository } from '../../../domain/ICityReviewCommentRepository';

export class VoteCityReviewCommentUseCase {
    constructor(private commentRepository: ICityReviewCommentRepository) { }

    async execute(userId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        const comment = await this.commentRepository.findById(commentId);
        if (!comment) throw new Error('City review comment not found');
        await this.commentRepository.vote(userId, commentId, type);
    }

    async removeVote(userId: string, commentId: string): Promise<void> {
        await this.commentRepository.removeVote(userId, commentId);
    }
}
