import { ICommentRepository } from '../../domain/ICommentRepository';
import { Comment } from '../../domain/Comment';

export class GetCommentsByUserUseCase {
    constructor(private commentRepository: ICommentRepository) { }

    async execute(userId: string, query: any, currentUserId?: string): Promise<{ comments: Comment[]; total: number; pagination: any }> {
        const result = await this.commentRepository.findByUserId(userId, query, currentUserId);

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
