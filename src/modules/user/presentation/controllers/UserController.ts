import { Request, Response } from 'express';
import { GetUsersUseCase } from '../../application/use-cases/GetUsersUseCase';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserByIdUseCase';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUserUseCase';
import { UploadAvatarUseCase } from '../../application/use-cases/UploadAvatarUseCase';
import { GetSavedPostsByUserUseCase } from '../../../post/application/use-cases/GetSavedPostsByUserUseCase';
import { GetUpvotedPostsByUserUseCase } from '../../../post/application/use-cases/GetUpvotedPostsByUserUseCase';
import { GetCommentsByUserUseCase } from '../../../comment/application/use-cases/GetCommentsByUserUseCase';
import { GetCityReviewsByUserUseCase } from '../../../city-review/application/use-cases/GetCityReviewsByUserUseCase';
import { GetSavedCityReviewsByUserUseCase } from '../../../city-review/application/use-cases/GetSavedCityReviewsByUserUseCase';
import { getAuthenticatedUserId, getOptionalAuthenticatedUserId } from '../../../../utils/authHelpers';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    UserQuerySchema,
    UpdateProfileSchema,
    IdSchema,
    validateQuery,
    validateParams,
    validateRequest,
    CommentQuerySchema,
    PaginationSchema
} from '../../../../types';

export class UserController {
    constructor(
        private getUsersUseCase: GetUsersUseCase,
        private getUserByIdUseCase: GetUserByIdUseCase,
        private updateUserUseCase: UpdateUserUseCase,
        private uploadAvatarUseCase: UploadAvatarUseCase,
        private getSavedPostsByUserUseCase: GetSavedPostsByUserUseCase,
        private getUpvotedPostsByUserUseCase: GetUpvotedPostsByUserUseCase,
        private getCommentsByUserUseCase: GetCommentsByUserUseCase,
        private getCityReviewsByUserUseCase: GetCityReviewsByUserUseCase,
        private getSavedCityReviewsByUserUseCase: GetSavedCityReviewsByUserUseCase
    ) { }

    public getUsers = async (req: Request, res: Response): Promise<void> => {
        try {
            const queryValidation = UserQuerySchema.safeParse(req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error.message));
                return;
            }

            const result = await this.getUsersUseCase.execute(queryValidation.data);
            const page = Number(queryValidation.data.page) || 1;
            const limit = Number(queryValidation.data.limit) || 20;
            const pagination = {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            };

            res.json(createPaginatedResponse(result.users.map(u => u.toJSON()), pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch users', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getUsersWithActivity = async (req: Request, res: Response): Promise<void> => {
        try {
            const queryValidation = UserQuerySchema.safeParse(req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error.message));
                return;
            }

            const result = await this.getUsersUseCase.executeWithActivity(queryValidation.data);
            const page = Number(queryValidation.data.page) || 1;
            const limit = Number(queryValidation.data.limit) || 20;
            const pagination = {
                page,
                limit,
                total: result.total,
                pages: Math.ceil(result.total / limit)
            };

            res.json(createPaginatedResponse(result.users.map(u => u.toJSON()), pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch users with activity', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getUserById = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
                return;
            }

            const user = await this.getUserByIdUseCase.execute(paramsValidation.data.id);
            if (!user) {
                res.status(404).json(createErrorResponse('User not found'));
                return;
            }

            res.json(createSuccessResponse('User retrieved successfully', user.toJSON()));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to retrieve user', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public updateUser = async (req: Request, res: Response): Promise<void> => {
        try {
            const requestingUserId = getAuthenticatedUserId(req);
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
                return;
            }

            const bodyValidation = validateRequest(UpdateProfileSchema, req.body);
            if (!bodyValidation.success) {
                res.status(400).json(createErrorResponse('Validation failed', bodyValidation.error));
                return;
            }

            const user = await this.updateUserUseCase.execute(requestingUserId, paramsValidation.data.id, bodyValidation.data as any);
            res.json(createSuccessResponse('User updated successfully', user.toJSON()));
        } catch (error) {
            if (error instanceof Error && error.message.includes('Permission denied')) {
                res.status(403).json(createErrorResponse(error.message));
                return;
            }
            res.status(400).json(createErrorResponse('Failed to update user', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public uploadAvatar = async (req: Request, res: Response): Promise<void> => {
        try {
            const requestingUserId = getAuthenticatedUserId(req);

            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
                return;
            }
            const { id } = paramsValidation.data;

            const file = req.file;
            if (!file) {
                res.status(400).json(createErrorResponse('No file uploaded'));
                return;
            }

            const buffer: Buffer = file.buffer;
            const mimeType: string = file.mimetype || 'application/octet-stream';

            const user = await this.uploadAvatarUseCase.execute(requestingUserId, id, buffer, String(mimeType));
            res.json(createSuccessResponse('Avatar uploaded successfully', user.toJSON()));
        } catch (error) {
            if (error instanceof Error && error.message.includes('Permission denied')) {
                res.status(403).json(createErrorResponse(error.message));
                return;
            }
            res.status(500).json(createErrorResponse('Failed to upload avatar', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getUserComments = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error));
                return;
            }

            const queryValidation = validateQuery(CommentQuerySchema, req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
                return;
            }

            const currentUserId = getOptionalAuthenticatedUserId(req);
            const result = await this.getCommentsByUserUseCase.execute(paramsValidation.data.id, queryValidation.data, currentUserId);

            res.json(createPaginatedResponse(result.comments.map(c => c.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch user comments', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getSavedPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) { res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error)); return; }

            const queryValidation = validateQuery(PaginationSchema, req.query);
            if (!queryValidation.success) { res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error)); return; }

            const result = await this.getSavedPostsByUserUseCase.execute(paramsValidation.data.id, queryValidation.data);
            res.json(createPaginatedResponse(result.posts.map(p => p.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch saved posts', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getUpvotedPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) { res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error)); return; }

            const queryValidation = validateQuery(PaginationSchema, req.query);
            if (!queryValidation.success) { res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error)); return; }

            const result = await this.getUpvotedPostsByUserUseCase.execute(paramsValidation.data.id, queryValidation.data);
            res.json(createPaginatedResponse(result.posts.map(p => p.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch upvoted posts', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getSavedCityReviews = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) { res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error)); return; }

            const queryValidation = validateQuery(PaginationSchema, req.query);
            if (!queryValidation.success) { res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error)); return; }

            const result = await this.getSavedCityReviewsByUserUseCase.execute(paramsValidation.data.id, queryValidation.data);
            res.json(createPaginatedResponse(result.reviews.map(r => r.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch saved reviews', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getUserCityReviews = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) { res.status(400).json(createErrorResponse('Invalid user ID', paramsValidation.error)); return; }

            const queryValidation = validateQuery(PaginationSchema, req.query);
            if (!queryValidation.success) { res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error)); return; }

            const currentUserId = getOptionalAuthenticatedUserId(req);
            const result = await this.getCityReviewsByUserUseCase.execute(paramsValidation.data.id, queryValidation.data, currentUserId);
            res.json(createPaginatedResponse(result.reviews.map(r => r.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch user reviews', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
