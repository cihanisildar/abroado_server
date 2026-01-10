import { PrismaClient } from '@prisma/client';
import { ICityReviewRepository } from '../../domain/ICityReviewRepository';
import { CityReview } from '../../domain/CityReview';
import { CityReviewMapper } from './CityReviewMapper';
import { CityReviewDto, UpdateCityReviewDto, CityReviewQuery } from '../../../../types';

export class PrismaCityReviewRepository implements ICityReviewRepository {
    constructor(private prisma: PrismaClient) { }

    private getInclude(userId?: string) {
        return {
            user: { select: { id: true, username: true, avatar: true, role: true } },
            city: { select: { id: true, name: true, country: true, slug: true } },
            saves: userId ? { where: { userId }, select: { id: true } } : false
        };
    }

    async findById(id: string, userId?: string): Promise<CityReview | null> {
        const review = await this.prisma.cityReview.findUnique({
            where: { id },
            include: this.getInclude(userId)
        });

        if (!review) return null;

        let userVote: 'UPVOTE' | 'DOWNVOTE' | null = null;
        if (userId) {
            const vote = await this.prisma.cityReviewVote.findUnique({
                where: { userId_cityReviewId: { userId, cityReviewId: id } }
            });
            userVote = vote?.type || null;
        }

        const isSaved = (review as any).saves?.length > 0;
        return CityReviewMapper.toDomain(review, userVote, isSaved);
    }

    async findAll(query: CityReviewQuery, userId?: string): Promise<{ reviews: CityReview[]; total: number }> {
        return this.findManyBase({}, query, userId);
    }

    async findByCityId(cityId: string, query: any, userId?: string): Promise<{ reviews: CityReview[]; total: number }> {
        return this.findManyBase({ cityId }, query, userId);
    }

    async findByUserId(targetUserId: string, query: any, currentUserId?: string): Promise<{ reviews: CityReview[]; total: number }> {
        return this.findManyBase({ userId: targetUserId }, query, currentUserId);
    }

    async findSavedByUser(userId: string, query: any): Promise<{ reviews: CityReview[]; total: number }> {
        const where = { saves: { some: { userId } } };
        return this.findManyBase(where, query, userId);
    }

    private async findManyBase(where: any, query: any, userId?: string) {
        const page = Math.max(1, query.page || 1);
        const limit = Math.min(Math.max(1, query.limit || 20), 100);
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            this.prisma.cityReview.findMany({
                where,
                include: this.getInclude(userId),
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            this.prisma.cityReview.count({ where })
        ]);

        let voteMap = new Map<string, 'UPVOTE' | 'DOWNVOTE'>();
        if (userId && reviews.length > 0) {
            const votes = await this.prisma.cityReviewVote.findMany({
                where: {
                    userId,
                    cityReviewId: { in: reviews.map(r => r.id) }
                }
            });
            votes.forEach(v => voteMap.set(v.cityReviewId, v.type));
        }

        const domainReviews = reviews.map(r =>
            CityReviewMapper.toDomain(r, voteMap.get(r.id), (r as any).saves?.length > 0)
        );

        return { reviews: domainReviews, total };
    }

    async create(userId: string, cityId: string, data: Omit<CityReviewDto, 'cityName' | 'country'>): Promise<CityReview> {
        const review = await this.prisma.cityReview.create({
            data: {
                userId,
                cityId,
                title: data.title ?? null,
                jobOpportunities: data.jobOpportunities,
                costOfLiving: data.costOfLiving,
                safety: data.safety,
                transport: data.transport,
                community: data.community,
                healthcare: data.healthcare ?? 3,
                education: data.education ?? 3,
                nightlife: data.nightlife ?? 3,
                weather: data.weather ?? 3,
                internet: data.internet ?? 3,
                pros: data.pros ?? [],
                cons: data.cons ?? [],
                note: data.note ?? null,
                images: data.images ?? [],
                language: data.language ?? null
            },
            include: this.getInclude()
        });

        return CityReviewMapper.toDomain(review);
    }

    async update(id: string, data: Partial<UpdateCityReviewDto>): Promise<CityReview> {
        const updateData: any = { ...data };

        const review = await this.prisma.cityReview.update({
            where: { id },
            data: updateData,
            include: this.getInclude()
        });
        return CityReviewMapper.toDomain(review);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.cityReview.delete({ where: { id } });
    }

    async vote(userId: string, reviewId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.cityReviewVote.findUnique({
                where: { userId_cityReviewId: { userId, cityReviewId: reviewId } }
            });

            if (existing) {
                if (existing.type === type) {
                    // No op or could untoggle, but keeping simple
                } else {
                    // Switch vote
                    await tx.cityReviewVote.update({
                        where: { id: existing.id },
                        data: { type }
                    });
                    const upInc = type === 'UPVOTE' ? 1 : -1;
                    const downInc = type === 'DOWNVOTE' ? 1 : -1;
                    await tx.cityReview.update({
                        where: { id: reviewId },
                        data: { upvotes: { increment: upInc }, downvotes: { increment: downInc } }
                    });
                }
            } else {
                // New vote
                await tx.cityReviewVote.create({
                    data: { userId, cityReviewId: reviewId, type }
                });
                const upInc = type === 'UPVOTE' ? 1 : 0;
                const downInc = type === 'DOWNVOTE' ? 1 : 0;
                await tx.cityReview.update({
                    where: { id: reviewId },
                    data: { upvotes: { increment: upInc }, downvotes: { increment: downInc } }
                });
            }
        });
    }

    async removeVote(userId: string, reviewId: string): Promise<void> {
        await this.prisma.$transaction(async (tx) => {
            const existing = await tx.cityReviewVote.findUnique({
                where: { userId_cityReviewId: { userId, cityReviewId: reviewId } }
            });

            if (existing) {
                await tx.cityReviewVote.delete({ where: { id: existing.id } });
                const upDec = existing.type === 'UPVOTE' ? 1 : 0;
                const downDec = existing.type === 'DOWNVOTE' ? 1 : 0;
                await tx.cityReview.update({
                    where: { id: reviewId },
                    data: { upvotes: { decrement: upDec }, downvotes: { decrement: downDec } }
                });
            }
        });
    }

    async save(userId: string, reviewId: string): Promise<void> {
        await this.prisma.cityReviewSave.create({
            data: { userId, cityReviewId: reviewId }
        });
    }

    async unsave(userId: string, reviewId: string): Promise<void> {
        await this.prisma.cityReviewSave.delete({
            where: { userId_cityReviewId: { userId, cityReviewId: reviewId } }
        });
    }

    async getCountriesStats(): Promise<{ country: string; count: number }[]> {
        const reviews = await this.prisma.cityReview.findMany({
            select: { city: { select: { country: true } } }
        });

        const map = new Map<string, number>();
        reviews.forEach(r => {
            const c = r.city?.country;
            if (c) map.set(c, (map.get(c) || 0) + 1);
        });

        return Array.from(map.entries()).map(([country, count]) => ({ country, count }));
    }
}
