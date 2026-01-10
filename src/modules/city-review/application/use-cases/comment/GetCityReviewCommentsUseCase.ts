import { ICityReviewCommentRepository } from '../../../domain/ICityReviewCommentRepository';
import { CityReviewComment } from '../../../domain/CityReviewComment';

export class GetCityReviewCommentsUseCase {
  constructor(private commentRepository: ICityReviewCommentRepository) { }

  async execute(cityReviewId: string, query: any, userId?: string): Promise<{ comments: CityReviewComment[]; total: number; pagination: any }> {
    const result = await this.commentRepository.findByCityReviewId(cityReviewId, query, userId);

    const page = Math.max(1, query.page || 1);
    const limit = Math.min(Math.max(1, query.limit || 20), 100);

    return {
      comments: result.comments,
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
