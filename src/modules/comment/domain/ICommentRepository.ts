import { Comment } from './Comment';
import { CommentDto } from '../../../types';

export interface ICommentRepository {
    findById(id: string): Promise<Comment | null>;
    findByPostId(postId: string, query: any, userId?: string): Promise<{ comments: Comment[]; total: number }>;
    findByUserId(userId: string, query: any, currentUserId?: string): Promise<{ comments: Comment[]; total: number }>;
    create(userId: string, postId: string, data: CommentDto): Promise<Comment>;
    update(id: string, content: string): Promise<Comment>;
    delete(id: string): Promise<boolean>;
    vote(userId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void>;
    removeVote(userId: string, commentId: string): Promise<void>;
    incrementPostCommentsCount(postId: string): Promise<void>;
    decrementPostCommentsCount(postId: string): Promise<void>;
}
