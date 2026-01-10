import { PrismaClient, PostCategory, PostTag } from '@prisma/client';
import { Post as DomainPost } from '../../domain/Post';
import { IPostRepository } from '../../domain/IPostRepository';
import { PostMapper } from './PostMapper';
import { PostQuery, PostDto, UpdatePostDto } from '../../../../types';

export class PrismaPostRepository implements IPostRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string, userId?: string): Promise<DomainPost | null> {
        const post = await this.prisma.post.findUnique({
            where: { id },
            include: {
                user: {
                    select: { id: true, username: true, avatar: true, role: true }
                },
                city: {
                    select: { id: true, name: true, country: true, slug: true }
                },
                votes: {
                    select: { type: true, userId: true }
                },
                saves: userId ? {
                    where: { userId },
                    select: { id: true }
                } : false
            }
        });

        if (!post) return null;

        // Add virtual fields for mapping
        const upvotes = post.votes.filter(v => v.type === 'UPVOTE').length;
        const downvotes = post.votes.filter(v => v.type === 'DOWNVOTE').length;
        const userVote = userId ? post.votes.find(v => v.userId === userId)?.type || null : null;
        const isSaved = userId ? (post.saves as any[])?.length > 0 : false;

        return PostMapper.toDomain({
            ...post,
            upvotes,
            downvotes,
            userVote,
            isSaved
        });
    }

    async findMany(query: PostQuery, userId?: string): Promise<{ posts: DomainPost[]; total: number }> {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {};
        if (query.search) {
            where.OR = [
                { title: { contains: query.search, mode: 'insensitive' } },
                { content: { contains: query.search, mode: 'insensitive' } }
            ];
        }
        if (query.category) where.category = query.category;
        if (query.tags && query.tags.length > 0) where.tags = { hasSome: query.tags };
        if (query.cityId) where.cityId = query.cityId;
        if (query.userId) where.userId = query.userId;

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, role: true, avatar: true } },
                    city: { select: { id: true, name: true, country: true } },
                    votes: { select: { type: true, userId: true } },
                    saves: userId ? { where: { userId }, select: { id: true } } : false,
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.post.count({ where })
        ]);

        const domainPosts = posts.map(post => {
            const upvotes = post.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = post.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = userId ? post.votes.find(v => v.userId === userId)?.type || null : null;
            const isSaved = userId ? (post.saves as any[])?.length > 0 : false;

            return PostMapper.toDomain({
                ...post,
                upvotes,
                downvotes,
                userVote,
                isSaved
            });
        });

        return { posts: domainPosts, total };
    }

    async create(userId: string, data: PostDto): Promise<DomainPost> {
        const post = await this.prisma.post.create({
            data: {
                title: data.title,
                content: data.content,
                category: data.category as PostCategory,
                tags: data.tags as PostTag[],
                images: data.images || [],
                user: { connect: { id: userId } },
                ...(data.cityId && { city: { connect: { id: data.cityId } } })
            },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } },
                city: { select: { id: true, name: true, country: true, slug: true } }
            }
        });

        return PostMapper.toDomain(post);
    }

    async update(id: string, data: UpdatePostDto): Promise<DomainPost> {
        const post = await this.prisma.post.update({
            where: { id },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.content && { content: data.content }),
                ...(data.category && { category: data.category as PostCategory }),
                ...(data.tags && { tags: data.tags as PostTag[] }),
                ...(data.images && { images: { set: data.images } }),
                ...(data.cityId && { city: { connect: { id: data.cityId } } })
            },
            include: {
                user: { select: { id: true, username: true, avatar: true, role: true } },
                city: { select: { id: true, name: true, country: true, slug: true } }
            }
        });

        return PostMapper.toDomain(post);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.post.delete({ where: { id } });
    }

    async incrementCommentsCount(id: string): Promise<void> {
        await this.prisma.post.update({
            where: { id },
            data: { commentsCount: { increment: 1 } }
        });
    }

    async vote(userId: string, postId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        await this.prisma.postVote.upsert({
            where: { userId_postId: { userId, postId } },
            update: { type },
            create: { userId, postId, type }
        });
    }

    async removeVote(userId: string, postId: string): Promise<void> {
        await this.prisma.postVote.delete({
            where: { userId_postId: { userId, postId } }
        });
    }

    async save(userId: string, postId: string): Promise<void> {
        await this.prisma.postSave.create({
            data: { userId, postId }
        });
    }

    async unsave(userId: string, postId: string): Promise<void> {
        await this.prisma.postSave.delete({
            where: { userId_postId: { userId, postId } }
        });
    }

    async getCountriesStats(): Promise<any> {
        const posts = await this.prisma.post.findMany({
            include: { city: { select: { country: true } } }
        });

        const map = new Map<string, number>();
        posts.forEach(p => {
            const country = p.city?.country;
            if (country) {
                map.set(country, (map.get(country) || 0) + 1);
            }
        });

        return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
    }
    async findSavedByUser(userId: string, query: any): Promise<{ posts: DomainPost[]; total: number }> {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {
            saves: { some: { userId } }
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, role: true, avatar: true } },
                    city: { select: { id: true, name: true, country: true } },
                    votes: { select: { type: true, userId: true } },
                    saves: { where: { userId }, select: { id: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.post.count({ where })
        ]);

        const domainPosts = posts.map(post => {
            const upvotes = post.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = post.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = post.votes.find(v => v.userId === userId)?.type || null;
            const isSaved = post.saves.length > 0;

            return PostMapper.toDomain({
                ...post,
                upvotes,
                downvotes,
                userVote,
                isSaved
            });
        });

        return { posts: domainPosts, total };
    }

    async findUpvotedByUser(userId: string, query: any): Promise<{ posts: DomainPost[]; total: number }> {
        const page = query.page || 1;
        const limit = Math.min(query.limit || 20, 100);
        const skip = (page - 1) * limit;

        const where: any = {
            votes: { some: { userId, type: 'UPVOTE' } }
        };

        const [posts, total] = await Promise.all([
            this.prisma.post.findMany({
                where,
                include: {
                    user: { select: { id: true, username: true, role: true, avatar: true } },
                    city: { select: { id: true, name: true, country: true } },
                    votes: { select: { type: true, userId: true } },
                    saves: { where: { userId }, select: { id: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.post.count({ where })
        ]);

        const domainPosts = posts.map(post => {
            const upvotes = post.votes.filter(v => v.type === 'UPVOTE').length;
            const downvotes = post.votes.filter(v => v.type === 'DOWNVOTE').length;
            const userVote = post.votes.find(v => v.userId === userId)?.type || null;
            const isSaved = post.saves.length > 0;

            return PostMapper.toDomain({
                ...post,
                upvotes,
                downvotes,
                userVote,
                isSaved
            });
        });

        return { posts: domainPosts, total };
    }
}
