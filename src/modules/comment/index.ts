import { prisma } from '../../lib/prisma';
import { PrismaCommentRepository } from './infrastructure/persistence/PrismaCommentRepository';
import { PrismaPostRepository } from '../post/infrastructure/persistence/PrismaPostRepository';
import { AddCommentUseCase } from './application/use-cases/AddCommentUseCase';
import { GetCommentsUseCase } from './application/use-cases/GetCommentsUseCase';
import { UpdateCommentUseCase } from './application/use-cases/UpdateCommentUseCase';
import { DeleteCommentUseCase } from './application/use-cases/DeleteCommentUseCase';
import { VoteCommentUseCase } from './application/use-cases/VoteCommentUseCase';
import { CommentController } from './presentation/controllers/CommentController';

// Shared instances (modular monolith approach)
const commentRepository = new PrismaCommentRepository(prisma);
const postRepository = new PrismaPostRepository(prisma);

const addCommentUseCase = new AddCommentUseCase(commentRepository, postRepository);
const getCommentsUseCase = new GetCommentsUseCase(commentRepository);
const updateCommentUseCase = new UpdateCommentUseCase(commentRepository);
const deleteCommentUseCase = new DeleteCommentUseCase(commentRepository);
const voteCommentUseCase = new VoteCommentUseCase(commentRepository);

const commentController = new CommentController(
    addCommentUseCase,
    getCommentsUseCase,
    updateCommentUseCase,
    deleteCommentUseCase,
    voteCommentUseCase
);

// Routes
import commentRouter from './presentation/routes';

export {
    commentController,
    commentRepository,
    commentRouter,
    addCommentUseCase,
    getCommentsUseCase,
    updateCommentUseCase,
    deleteCommentUseCase,
    voteCommentUseCase
};
