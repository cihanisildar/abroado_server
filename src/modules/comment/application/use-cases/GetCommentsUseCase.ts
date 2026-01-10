import { ICommentRepository } from '../../domain/ICommentRepository';
import { Comment } from '../../domain/Comment';

export class GetCommentsUseCase {
    constructor(private commentRepository: ICommentRepository) { }

    async execute(postId: string, query: any, userId?: string): Promise<{ comments: Comment[]; total: number; pagination: any }> {
        const result = await this.commentRepository.findByPostId(postId, query, userId);

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
