import { CityReviewComment } from './CityReviewComment';
import { CommentDto } from '../../../types'; // reusing CommentDto

export interface ICityReviewCommentRepository {
    findById(id: string): Promise<CityReviewComment | null>;
    findByCityReviewId(cityReviewId: string, query: any, userId?: string): Promise<{ comments: CityReviewComment[]; total: number }>;
    create(userId: string, cityReviewId: string, data: CommentDto): Promise<CityReviewComment>;
    update(id: string, content: string): Promise<CityReviewComment>;
    delete(id: string): Promise<boolean>; // Returns true if hard deleted
    vote(userId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void>;
    removeVote(userId: string, commentId: string): Promise<void>;
    incrementCommentsCount(cityReviewId: string): Promise<void>; // Move to review repo? or keep here? Usually cross-aggregate updates happen via events or direct calls. The old service did it directly.
    decrementCommentsCount(cityReviewId: string): Promise<void>;
}
