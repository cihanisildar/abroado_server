import { CityReview } from './CityReview';
import { CityReviewDto, UpdateCityReviewDto, CityReviewQuery } from '../../../types';

export interface ICityReviewRepository {
    findById(id: string, userId?: string): Promise<CityReview | null>;
    findAll(query: CityReviewQuery, userId?: string): Promise<{ reviews: CityReview[]; total: number }>;
    findByCityId(cityId: string, query: any, userId?: string): Promise<{ reviews: CityReview[]; total: number }>;
    findByUserId(targetUserId: string, query: any, currentUserId?: string): Promise<{ reviews: CityReview[]; total: number }>;
    findSavedByUser(userId: string, query: any): Promise<{ reviews: CityReview[]; total: number }>;

    create(userId: string, cityId: string, data: Omit<CityReviewDto, 'cityName' | 'country'>): Promise<CityReview>;
    update(id: string, data: Partial<UpdateCityReviewDto>): Promise<CityReview>;
    delete(id: string): Promise<void>;

    vote(userId: string, reviewId: string, type: 'UPVOTE' | 'DOWNVOTE'): Promise<void>;
    removeVote(userId: string, reviewId: string): Promise<void>;

    save(userId: string, reviewId: string): Promise<void>;
    unsave(userId: string, reviewId: string): Promise<void>;

    getCountriesStats(): Promise<{ country: string; count: number }[]>;
}
