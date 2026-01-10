import { PostQuery, PostDto, UpdatePostDto } from '../../../types';
import { Post } from './Post';

export interface IPostRepository {
    findById(id: string, userId?: string): Promise<Post | null>;
    findMany(query: PostQuery, userId?: string): Promise<{ posts: Post[]; total: number }>;
    create(userId: string, data: PostDto): Promise<Post>;
    update(id: string, data: UpdatePostDto): Promise<Post>;
    delete(id: string): Promise<void>;
    incrementCommentsCount(id: string): Promise<void>;
    vote(userId: string, postId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void>;
    removeVote(userId: string, postId: string): Promise<void>;
    save(userId: string, postId: string): Promise<void>;
    unsave(userId: string, postId: string): Promise<void>;
    getCountriesStats(): Promise<any>;
    findSavedByUser(userId: string, query: any): Promise<{ posts: Post[]; total: number }>;
    findUpvotedByUser(userId: string, query: any): Promise<{ posts: Post[]; total: number }>;
}
