import { Request, Response } from 'express';
import { CreatePostUseCase } from '../../application/use-cases/CreatePostUseCase';
import { GetPostsUseCase } from '../../application/use-cases/GetPostsUseCase';
import { GetPostByIdUseCase } from '../../application/use-cases/GetPostByIdUseCase';
import { UpdatePostUseCase } from '../../application/use-cases/UpdatePostUseCase';
import { DeletePostUseCase } from '../../application/use-cases/DeletePostUseCase';
import { VotePostUseCase } from '../../application/use-cases/VotePostUseCase';
import { SavePostUseCase } from '../../application/use-cases/SavePostUseCase';
import { getAuthenticatedUserId, getOptionalAuthenticatedUserId } from '../../../../utils/authHelpers';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    PostSchema,
    PostQuerySchema,
    UpdatePostSchema,
    validateRequest,
    validateQuery,
} from '../../../../types';

export class PostController {
    constructor(
        private createPostUseCase: CreatePostUseCase,
        private getPostsUseCase: GetPostsUseCase,
        private getPostByIdUseCase: GetPostByIdUseCase,
        private updatePostUseCase: UpdatePostUseCase,
        private deletePostUseCase: DeletePostUseCase,
        private votePostUseCase: VotePostUseCase,
        private savePostUseCase: SavePostUseCase
    ) { }

    public createPost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const postData = req.is('multipart/form-data') ? {
                title: req.body.title,
                content: req.body.content,
                category: req.body.category || 'DISCUSSION',
                tags: Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags].filter(Boolean),
                cityId: req.body.cityId || undefined
            } : req.body;

            const validation = validateRequest(PostSchema, postData);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const post = await this.createPostUseCase.execute(userId as string, {
                ...validation.data,
                category: validation.data.category || 'DISCUSSION'
            });
            res.status(201).json(createSuccessResponse('Post created successfully', post.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to create post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getPosts = async (req: Request, res: Response): Promise<void> => {
        try {
            const queryValidation = validateQuery(PostQuerySchema, req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
                return;
            }

            const userId = getOptionalAuthenticatedUserId(req);
            const result = await this.getPostsUseCase.execute(queryValidation.data as any, userId as string | undefined);

            res.json(createPaginatedResponse(result.posts.map(p => p.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch posts', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getPostById = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getOptionalAuthenticatedUserId(req);
            const { id } = req.params;
            const post = await this.getPostByIdUseCase.execute(id as string, userId as string | undefined);
            res.json(createSuccessResponse('Post retrieved successfully', post.toJSON()));
        } catch (error) {
            const statusCode = error instanceof Error && error.message === 'Post not found' ? 404 : 500;
            res.status(statusCode).json(createErrorResponse(error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public updatePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            const validation = validateRequest(UpdatePostSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const post = await this.updatePostUseCase.execute(userId as string, id as string, validation.data);
            res.json(createSuccessResponse('Post updated successfully', post.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to update post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public deletePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.deletePostUseCase.execute(userId as string, id as string);
            res.json(createSuccessResponse('Post deleted successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to delete post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public upvotePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.votePostUseCase.execute(userId as string, id as string, 'UPVOTE');
            res.json(createSuccessResponse('Post upvoted successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to upvote post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public downvotePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.votePostUseCase.execute(userId as string, id as string, 'DOWNVOTE');
            res.json(createSuccessResponse('Post downvoted successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to downvote post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public removeVote = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.votePostUseCase.removeVote(userId as string, id as string);
            res.json(createSuccessResponse('Vote removed successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public savePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.savePostUseCase.execute(userId as string, id as string);
            res.json(createSuccessResponse('Post saved successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to save post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public unsavePost = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            await this.savePostUseCase.unsave(userId as string, id as string);
            res.json(createSuccessResponse('Post unsaved successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to unsave post', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
