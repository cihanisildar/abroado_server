import { Comment as DomainComment } from '../../domain/Comment';

export class CommentMapper {
    public static toDomain(prismaComment: any): DomainComment {
        return new DomainComment({
            id: prismaComment.id,
            userId: prismaComment.userId,
            postId: prismaComment.postId,
            parentCommentId: prismaComment.parentCommentId,
            content: prismaComment.content,
            createdAt: prismaComment.createdAt,
            updatedAt: prismaComment.updatedAt,
            user: prismaComment.user,
            upvotes: prismaComment.upvotes || 0,
            downvotes: prismaComment.downvotes || 0,
            userVote: prismaComment.userVote,
            replies: prismaComment.replies?.map((r: any) => this.toDomain(r)) || []
        });
    }
}
