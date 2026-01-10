import { IPostRepository } from '../../domain/IPostRepository';
import { Post } from '../../domain/Post';

export class GetPostByIdUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(id: string, userId?: string): Promise<Post> {
        const post = await this.postRepository.findById(id, userId);
        if (!post) {
            throw new Error('Post not found');
        }
        return post;
    }
}
