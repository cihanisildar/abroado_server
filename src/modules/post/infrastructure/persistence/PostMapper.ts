import { Post as DomainPost } from '../../domain/Post';

export class PostMapper {
    public static toDomain(prismaPost: any): DomainPost {
        return new DomainPost({
            id: prismaPost.id,
            title: prismaPost.title,
            content: prismaPost.content,
            category: prismaPost.category,
            tags: prismaPost.tags,
            images: prismaPost.images,
            userId: prismaPost.userId,
            cityId: prismaPost.cityId,
            upvotes: prismaPost.upvotes || 0,
            downvotes: prismaPost.downvotes || 0,
            commentsCount: prismaPost.commentsCount || 0,
            viewsCount: prismaPost.viewsCount || 0,
            createdAt: prismaPost.createdAt,
            updatedAt: prismaPost.updatedAt,
            isUpvoted: prismaPost.userVote === 'UPVOTE',
            isDownvoted: prismaPost.userVote === 'DOWNVOTE',
            isSaved: prismaPost.isSaved,
            author: prismaPost.user,
            city: prismaPost.city,
        });
    }

    public static toPersistence(domainPost: DomainPost): any {
        return {
            id: domainPost.id,
            title: domainPost.title,
            content: domainPost.content,
            category: domainPost.category,
            tags: domainPost.tags,
            images: domainPost.images,
            userId: domainPost.userId,
            cityId: domainPost.cityId,
            commentsCount: domainPost.commentsCount,
            createdAt: domainPost.createdAt,
            updatedAt: domainPost.updatedAt,
        };
    }
}
