import { IPostRepository } from '../../domain/IPostRepository';
import { PostQuery } from '../../../../types';
import { Post } from '../../domain/Post';

export class GetPostsUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(query: PostQuery, userId?: string): Promise<{ posts: Post[]; total: number; pagination: any }> {
        const result = await this.postRepository.findMany(query, userId);

        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);

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
