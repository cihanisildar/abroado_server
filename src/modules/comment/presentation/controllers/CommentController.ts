import { Request, Response } from 'express';
import { AddCommentUseCase } from '../../application/use-cases/AddCommentUseCase';
import { GetCommentsUseCase } from '../../application/use-cases/GetCommentsUseCase';
import { UpdateCommentUseCase } from '../../application/use-cases/UpdateCommentUseCase';
import { DeleteCommentUseCase } from '../../application/use-cases/DeleteCommentUseCase';
import { VoteCommentUseCase } from '../../application/use-cases/VoteCommentUseCase';
import { getAuthenticatedUserId, getOptionalAuthenticatedUserId } from '../../../../utils/authHelpers';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    CommentSchema,
    UpdateCommentSchema,
    validateRequest,
} from '../../../../types';

export class CommentController {
    constructor(
        private addCommentUseCase: AddCommentUseCase,
        private getCommentsUseCase: GetCommentsUseCase,
        private updateCommentUseCase: UpdateCommentUseCase,
        private deleteCommentUseCase: DeleteCommentUseCase,
        private voteCommentUseCase: VoteCommentUseCase
    ) { }

    public addComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id: postId } = req.params;

            if (!postId) {
                res.status(400).json(createErrorResponse('Post ID is required'));
                return;
            }

            const validation = validateRequest(CommentSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const commentDto: any = {
                content: validation.data.content,
                ...(validation.data.parentCommentId ? { parentCommentId: validation.data.parentCommentId } : {})
            };

            const comment = await this.addCommentUseCase.execute(userId, postId, commentDto);
            res.status(201).json(createSuccessResponse('Comment added successfully', comment.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to add comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getPostComments = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getOptionalAuthenticatedUserId(req);
            const { id: postId } = req.params;

            if (!postId) {
                res.status(400).json(createErrorResponse('Post ID is required'));
                return;
            }

            const result = await this.getCommentsUseCase.execute(postId, req.query, userId);

            res.json(createPaginatedResponse(result.comments.map(c => c.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch comments', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public updateComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            const validation = validateRequest(UpdateCommentSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const comment = await this.updateCommentUseCase.execute(userId, id, validation.data.content as string);
            res.json(createSuccessResponse('Comment updated', comment.toJSON()));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to update comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public deleteComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;

            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }

            await this.deleteCommentUseCase.execute(userId, id);
            res.json(createSuccessResponse('Comment deleted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to delete comment', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public upvoteComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCommentUseCase.execute(userId, id, 'UPVOTE');
            res.json(createSuccessResponse('Comment upvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to upvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public downvoteComment = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCommentUseCase.execute(userId, id, 'DOWNVOTE');
            res.json(createSuccessResponse('Comment downvoted', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to downvote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public removeVote = async (req: Request, res: Response): Promise<void> => {
        try {
            const userId = getAuthenticatedUserId(req);
            const { id } = req.params;
            if (!id) { res.status(400).json(createErrorResponse('ID is required')); return; }
            await this.voteCommentUseCase.removeVote(userId, id);
            res.json(createSuccessResponse('Vote removed', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to remove vote', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
