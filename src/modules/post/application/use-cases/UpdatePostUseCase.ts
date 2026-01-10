import { IPostRepository } from '../../domain/IPostRepository';
import { UpdatePostDto } from '../../../../types';
import { Post } from '../../domain/Post';

export class UpdatePostUseCase {
    constructor(private postRepository: IPostRepository) { }

    async execute(userId: string, postId: string, data: UpdatePostDto): Promise<Post> {
        const post = await this.postRepository.findById(postId);
        if (!post) throw new Error('Post not found');

        if (!post.canBeEditedBy(userId)) {
            throw new Error('Unauthorized: You can only edit your own posts');
        }

        return await this.postRepository.update(postId, data);
    }
}
