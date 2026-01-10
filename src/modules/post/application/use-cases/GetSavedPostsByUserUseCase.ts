import { IPostRepository } from '../../domain/IPostRepository';
import { Post } from '../../domain/Post';

export class GetSavedPostsByUserUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(userId: string, query: any): Promise<{ posts: Post[]; total: number; pagination: any }> {
        const result = await this.postRepository.findSavedByUser(userId, query);

        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);

        return {
            posts: result.posts,
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
