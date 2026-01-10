import { PrismaClient } from '@prisma/client';
import { ICommentRepository } from '../../domain/ICommentRepository';
import { Comment as DomainComment } from '../../domain/Comment';
import { CommentMapper } from './CommentMapper';
import { CommentDto } from '../../../../types';

export class PrismaCommentRepository implements ICommentRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<DomainComment | null> {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });

        if (!comment) return null;
        return CommentMapper.toDomain(comment);
    }

    async findByPostId(postId: string, query: any, userId?: string): Promise<{ comments: DomainComment[]; total: number }> {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);
        const skip = (page - 1) * limit;

        // Get all comments for this post
        const [allComments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where: { postId },
                include: {
                    user: { select: { id: true, username: true, avatar: true, role: true } },
                    votes: { select: { type: true, userId: true } }
                },
                orderBy: { createdAt: 'asc' }
            }),
            this.prisma.comment.count({ where: { postId, parentCommentId: null } })
        ]);

        // Transform and build tree
        const transformed = allComments.map(c => {
            const upvotes = c.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = c.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = userId ? c.votes.find(v => v.userId === userId)?.type : null;
            return { ...c, upvotes, downvotes, userVote };
        });

        const commentMap = new Map();
        const rootComments: any[] = [];

        transformed.forEach(c => {
            const domain = CommentMapper.toDomain(c);
            commentMap.set(c.id, domain);
            if (!c.parentCommentId) rootComments.push(domain);
        });

        transformed.forEach(c => {
            if (c.parentCommentId) {
                const parent = commentMap.get(c.parentCommentId);
                if (parent) {
                    (parent as any).props.replies = (parent as any).props.replies || [];
                    (parent as any).props.replies.push(commentMap.get(c.id));
                }
            }
        });

        // Pagination for roots
        rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const paginated = rootComments.slice(skip, skip + limit);

        return { comments: paginated, total };
    }

    async findByUserId(userId: string, query: any, currentUserId?: string): Promise<{ comments: DomainComment[]; total: number }> {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);
        const skip = (page - 1) * limit;
        const postId = query.postId;

        const where: any = { userId };
        if (postId) {
            where.postId = postId;
        }

        const [comments, total] = await Promise.all([
            this.prisma.comment.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, avatar: true, role: true } },
                    votes: { select: { type: true, userId: true } },
                    post: { select: { id: true, title: true } } // Include post info if needed for display? Maybe mapped to something.
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.comment.count({ where })
        ]);

        const domainComments = comments.map(c => {
            const upvotes = c.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = c.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = currentUserId ? c.votes.find(v => v.userId === currentUserId)?.type : null;
            return CommentMapper.toDomain({ ...c, upvotes, downvotes, userVote });
        });

        return { comments: domainComments, total };
    }

    async create(userId: string, postId: string, data: CommentDto): Promise<DomainComment> {
        const comment = await this.prisma.comment.create({
            data: {
                content: data.content,
                userId,
                postId,
                parentCommentId: data.parentCommentId || null
            },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });

        return CommentMapper.toDomain(comment);
    }

    async update(id: string, content: string): Promise<DomainComment> {
        const comment = await this.prisma.comment.update({
            where: { id },
            data: { content },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });
        return CommentMapper.toDomain(comment);
    }

    async delete(id: string): Promise<boolean> {
        const comment = await this.prisma.comment.findUnique({
            where: { id },
            include: { replies: true }
        });

        if (comment && comment.replies.length > 0) {
            await this.prisma.comment.update({
                where: { id },
                data: { content: '[deleted]' }
            });
            return false;
        } else {
            await this.prisma.comment.delete({ where: { id } });
            return true;
        }
    }

    async vote(userId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        await this.prisma.commentVote.upsert({
            where: { userId_commentId: { userId, commentId } },
            update: { type },
            create: { userId, commentId, type }
        });
    }

    async removeVote(userId: string, commentId: string): Promise<void> {
        await this.prisma.commentVote.delete({
            where: { userId_commentId: { userId, commentId } }
        });
    }

    async incrementPostCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentsCount: { increment: 1 } }
        });
    }

    async decrementPostCommentsCount(postId: string): Promise<void> {
        await this.prisma.post.update({
            where: { id: postId },
            data: { commentsCount: { decrement: 1 } }
        });
    }
}
