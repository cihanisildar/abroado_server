import { CityReview as DomainCityReview } from '../../domain/CityReview';

export class CityReviewMapper {
    public static toDomain(prismaReview: any, userVote?: 'UPVOTE' | 'DOWNVOTE' | null, isSaved: boolean = false): DomainCityReview {
        return new DomainCityReview({
            id: prismaReview.id,
            userId: prismaReview.userId,
            cityId: prismaReview.cityId,
            title: prismaReview.title || null,
            jobOpportunities: prismaReview.jobOpportunities || 0,
            costOfLiving: prismaReview.costOfLiving || 0,
            safety: prismaReview.safety || 0,
            transport: prismaReview.transport || 0,
            community: prismaReview.community || 0,
            healthcare: prismaReview.healthcare || 0,
            education: prismaReview.education || 0,
            nightlife: prismaReview.nightlife || 0,
            weather: prismaReview.weather || 0,
            internet: prismaReview.internet || 0,
            pros: prismaReview.pros || [],
            cons: prismaReview.cons || [],
            note: prismaReview.note || null,
            images: prismaReview.images || [],
            language: prismaReview.language || null,
            likes: prismaReview.likes || 0,
            upvotes: prismaReview.upvotes || 0,
            downvotes: prismaReview.downvotes || 0,
            commentsCount: prismaReview.commentsCount || 0,
            createdAt: prismaReview.createdAt,
            updatedAt: prismaReview.updatedAt,
            ...(prismaReview.user ? {
                user: {
                    id: prismaReview.user.id,
                    username: prismaReview.user.username,
                    avatar: prismaReview.user.avatar,
                    role: prismaReview.user.role
                }
            } : {}),
            ...(prismaReview.city ? {
                city: {
                    id: prismaReview.city.id,
                    name: prismaReview.city.name,
                    country: prismaReview.city.country,
                    slug: prismaReview.city.slug || undefined
                }
            } : {}),
            ...(userVote !== undefined ? { userVote } : {}),
            ...(isSaved !== undefined ? { isSaved } : {})
        });
    }
}
