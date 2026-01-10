import { Request, Response } from 'express';
import { CreateCityReviewUseCase } from '../../application/use-cases/CreateCityReviewUseCase';
import { GetCityReviewsUseCase } from '../../application/use-cases/GetCityReviewsUseCase';
import { GetCityReviewByIdUseCase } from '../../application/use-cases/GetCityReviewByIdUseCase';
import { UpdateCityReviewUseCase } from '../../application/use-cases/UpdateCityReviewUseCase';
import { DeleteCityReviewUseCase } from '../../application/use-cases/DeleteCityReviewUseCase';
import { VoteCityReviewUseCase } from '../../application/use-cases/VoteCityReviewUseCase';
import { SaveCityReviewUseCase } from '../../application/use-cases/SaveCityReviewUseCase';
import { GetReviewCountriesStatsUseCase } from '../../application/use-cases/GetReviewCountriesStatsUseCase';
import { GetCityReviewCommentsUseCase } from '../../application/use-cases/comment/GetCityReviewCommentsUseCase';
import { AddCityReviewCommentUseCase } from '../../application/use-cases/comment/AddCityReviewCommentUseCase';
import { UpdateCityReviewCommentUseCase } from '../../application/use-cases/comment/UpdateCityReviewCommentUseCase';
import { DeleteCityReviewCommentUseCase } from '../../application/use-cases/comment/DeleteCityReviewCommentUseCase';
import { VoteCityReviewCommentUseCase } from '../../application/use-cases/comment/VoteCityReviewCommentUseCase';

import { getAuthenticatedUserId, getOptionalAuthenticatedUserId } from '../../../../utils/authHelpers';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    CityReviewSchema,
    CityReviewUpdateSchema,
    CityReviewQuerySchema,
    CommentSchema,
    validateRequest,
    validateParams,
    IdSchema,
    UpdateCommentSchema
} from '../../../../types';

export class CityReviewController {
    constructor(
        private createCityReviewUseCase: CreateCityReviewUseCase,
        private getCityReviewsUseCase: GetCityReviewsUseCase,
        private getCityReviewByIdUseCase: GetCityReviewByIdUseCase,
        private updateCityReviewUseCase: UpdateCityReviewUseCase,
        private deleteCityReviewUseCase: DeleteCityReviewUseCase,
        private voteCityReviewUseCase: VoteCityReviewUseCase,
        private saveCityReviewUseCase: SaveCityReviewUseCase,
        private getReviewCountriesStatsUseCase: GetReviewCountriesStatsUseCase,
        // Comment Use Cases
        private getCityReviewCommentsUseCase: GetCityReviewCommentsUseCase,
        private addCityReviewCommentUseCase: AddCityReviewCommentUseCase,
        private updateCityReviewCommentUseCase: UpdateCityReviewCommentUseCase,
        private deleteCityReviewCommentUseCase: DeleteCityReviewCommentUseCase,
        private voteCityReviewCommentUseCase: VoteCityReviewCommentUseCase
    ) { }

    // --- CRUD ---

    public getAllCityReviews = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getOptionalAuthenticatedUserId(req);
            const validation = validateRequest(CityReviewQuerySchema, req.query);

            const query = validation.success ? validation.data : req.query;
            const result = await this.getCityReviewsUseCase.execute(query as any, userId);

            res.json(createPaginatedResponse(result.reviews.map(r => r.toJSON()), {
                page: Number(query.page || 1),
                limit: Number(query.limit || 20),
                total: result.total,
                pages: Math.ceil(result.total / Number(query.limit || 20))
            }));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch city reviews', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getReviewById = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getOptionalAuthenticatedUserId(req);
            const { reviewId } = req.params;

            if (!reviewId) {
                res.status(400).json(createErrorResponse('Review ID is required'));
                return;
            }

            const review = await this.getCityReviewByIdUseCase.execute(reviewId, userId);
            if (!review) {
                res.status(404).json(createErrorResponse('Review not found'));
                return;
            }

            res.json(createSuccessResponse('Review fetched successfully', review.toJSON()));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getReviewCountriesStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const stats = await this.getReviewCountriesStatsUseCase.execute();
            res.json(createSuccessResponse('Countries stats fetched successfully', stats));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch stats', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public createCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);

            const cityId = req.params.cityId || req.body.cityId;
            if (!cityId) {
                res.status(400).json(createErrorResponse('City ID is required'));
                return;
            }

            const validation = validateRequest(CityReviewSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            // Force cast to avoid strict null checks on undefined properties
            // Domain layer should handle null/undefined conversions if needed, but schema ensure defaults or nulls.
            const data = validation.data as any;

            const review = await this.createCityReviewUseCase.execute(userId, cityId, data);
            res.status(201).json(createSuccessResponse('Review created successfully', review.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to create review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };


    public updateReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;

            if (!reviewId) {
                res.status(400).json(createErrorResponse('Review ID is required'));
                return;
            }

            const validation = validateRequest(CityReviewUpdateSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const data = validation.data as any;

            const review = await this.updateCityReviewUseCase.execute(userId, reviewId, data);
            res.json(createSuccessResponse('Review updated successfully', review.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to update review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public deleteReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;

            if (!reviewId) {
                res.status(400).json(createErrorResponse('Review ID is required'));
                return;
            }

            await this.deleteCityReviewUseCase.execute(userId, reviewId);
            res.json(createSuccessResponse('Review deleted successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to delete review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };


    // --- Voting ---

    public upvoteCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;
            if (!reviewId) { res.status(400).json(createErrorResponse('Review ID is required')); return; }
            await this.voteCityReviewUseCase.execute(userId, reviewId, 'UPVOTE');
            res.json(createSuccessResponse('Review upvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to upvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public downvoteCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;
            if (!reviewId) { res.status(400).json(createErrorResponse('Review ID is required')); return; }
            await this.voteCityReviewUseCase.execute(userId, reviewId, 'DOWNVOTE');
            res.json(createSuccessResponse('Review downvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to downvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public removeVoteFromCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;
            if (!reviewId) { res.status(400).json(createErrorResponse('Review ID is required')); return; }
            await this.voteCityReviewUseCase.removeVote(userId, reviewId);
            res.json(createSuccessResponse('Vote removed', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // --- Saving ---

    public saveCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;
            if (!reviewId) { res.status(400).json(createErrorResponse('Review ID is required')); return; }
            await this.saveCityReviewUseCase.execute(userId, reviewId);
            res.json(createSuccessResponse('Review saved', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to save review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public unsaveCityReview = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { reviewId } = req.params;
            if (!reviewId) { res.status(400).json(createErrorResponse('Review ID is required')); return; }
            await this.saveCityReviewUseCase.unsave(userId, reviewId);
            res.json(createSuccessResponse('Review unsaved', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to unsave review', error instanceof Error ? error.message : 'Unknown error'));
        }
    };


    // --- Comments ---

    public getCityReviewComments = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getOptionalAuthenticatedUserId(req);
            const { id } = req.params;

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            const result = await this.getCityReviewCommentsUseCase.execute(id, req.query, userId);
            res.json(createPaginatedResponse(result.comments.map(c => c.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch comments', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public addCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params; // reviewId

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            const validation = validateRequest(CommentSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const commentDto: any = {
                content: validation.data.content,
                ...(validation.data.parentCommentId ? { parentCommentId: validation.data.parentCommentId } : {})
            };

            const comment = await this.addCityReviewCommentUseCase.execute(userId, id, commentDto);
            res.status(201).json(createSuccessResponse('Comment added', comment.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to add comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public updateCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params; // commentId

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            const validation = validateRequest(UpdateCommentSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const comment = await this.updateCityReviewCommentUseCase.execute(userId, id, validation.data.content as string);
            res.json(createSuccessResponse('Comment updated', comment.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to update comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public deleteCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params; // commentId

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            await this.deleteCityReviewCommentUseCase.execute(userId, id);
            res.json(createSuccessResponse('Comment deleted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to delete comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public upvoteCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCityReviewCommentUseCase.execute(userId, id, 'UPVOTE');
            res.json(createSuccessResponse('Comment upvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to upvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public downvoteCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCityReviewCommentUseCase.execute(userId, id, 'DOWNVOTE');
            res.json(createSuccessResponse('Comment downvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to downvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public removeVoteFromCityReviewComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCityReviewCommentUseCase.removeVote(userId, id);
            res.json(createSuccessResponse('Vote removed', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
