import { PrismaClient } from '@prisma/client';
import { ICityReviewCommentRepository } from '../../domain/ICityReviewCommentRepository';
import { CityReviewComment as DomainComment } from '../../domain/CityReviewComment';
import { CityReviewCommentMapper } from './CityReviewCommentMapper';
import { CommentDto } from '../../../../types';

export class PrismaCityReviewCommentRepository implements ICityReviewCommentRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<DomainComment | null> {
        const comment = await this.prisma.cityReviewComment.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });

        if (!comment) return null;
        // Note: mapper expects votes/replies structure, which requires deeper query or default
        return CityReviewCommentMapper.toDomain(comment);
    }

    async findByCityReviewId(cityReviewId: string, query: any, userId?: string): Promise<{ comments: DomainComment[]; total: number }> {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);
        const skip = (page - 1) * limit;

        const [allComments, total] = await Promise.all([
            this.prisma.cityReviewComment.findMany({
                where: { cityReviewId },
                include: {
                    user: { select: { id: true, username: true, avatar: true, role: true } },
                    votes: { select: { type: true, userId: true } }
                },
                orderBy: { createdAt: 'asc' }
            }),
            this.prisma.cityReviewComment.count({ where: { cityReviewId, parentCommentId: null } })
        ]);

        const transformed = allComments.map(c => {
            const upvotes = c.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = c.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = userId ? c.votes.find(v => v.userId === userId)?.type : null;
            return { ...c, upvotes, downvotes, userVote };
        });

        const commentMap = new Map();
        const rootComments: any[] = [];

        transformed.forEach(c => {
            const domain = CityReviewCommentMapper.toDomain(c);
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

        rootComments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const paginated = rootComments.slice(skip, skip + limit);

        return { comments: paginated, total };
    }

    async create(userId: string, cityReviewId: string, data: CommentDto): Promise<DomainComment> {
        const comment = await this.prisma.cityReviewComment.create({
            data: {
                content: data.content,
                userId,
                cityReviewId,
                parentCommentId: data.parentCommentId || null
            },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });

        return CityReviewCommentMapper.toDomain(comment);
    }

    async update(id: string, content: string): Promise<DomainComment> {
        const comment = await this.prisma.cityReviewComment.update({
            where: { id },
            data: { content },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } }
            }
        });
        return CityReviewCommentMapper.toDomain(comment);
    }

    async delete(id: string): Promise<boolean> {
        const comment = await this.prisma.cityReviewComment.findUnique({
            where: { id },
            include: { replies: true }
        });

        if (comment && comment.replies.length > 0) {
            await this.prisma.cityReviewComment.update({
                where: { id },
                data: { content: '[deleted]' }
            });
            return false; // Soft delete
        } else {
            await this.prisma.cityReviewComment.delete({ where: { id } });
            return true; // Hard delete
        }
    }

    async vote(userId: string, commentId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        await this.prisma.cityReviewCommentVote.upsert({
            where: { userId_cityReviewCommentId: { userId, cityReviewCommentId: commentId } },
            update: { type },
            create: { userId, cityReviewCommentId: commentId, type }
        });
    }

    async removeVote(userId: string, commentId: string): Promise<void> {
        await this.prisma.cityReviewCommentVote.delete({
            where: { userId_cityReviewCommentId: { userId, cityReviewCommentId: commentId } }
        });
    }

    async incrementCommentsCount(cityReviewId: string): Promise<void> {
        await this.prisma.cityReview.update({
            where: { id: cityReviewId },
            data: { commentsCount: { increment: 1 } }
        });
    }

    async decrementCommentsCount(cityReviewId: string): Promise<void> {
        await this.prisma.cityReview.update({
            where: { id: cityReviewId },
            data: { commentsCount: { decrement: 1 } }
        });
    }
}
