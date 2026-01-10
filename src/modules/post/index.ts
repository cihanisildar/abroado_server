import { prisma } from '../../lib/prisma';
import { PrismaPostRepository } from './infrastructure/persistence/PrismaPostRepository';
import { CreatePostUseCase } from './application/use-cases/CreatePostUseCase';
import { GetPostsUseCase } from './application/use-cases/GetPostsUseCase';
import { GetPostByIdUseCase } from './application/use-cases/GetPostByIdUseCase';
import { UpdatePostUseCase } from './application/use-cases/UpdatePostUseCase';
import { DeletePostUseCase } from './application/use-cases/DeletePostUseCase';
import { VotePostUseCase } from './application/use-cases/VotePostUseCase';
import { SavePostUseCase } from './application/use-cases/SavePostUseCase';
import { PostController } from './presentation/controllers/PostController';
import { ensureCityExistsUseCase } from '../city';

// Dependency Injection
export const postRepository = new PrismaPostRepository(prisma);

const createPostUseCase = new CreatePostUseCase(postRepository, ensureCityExistsUseCase);
const getPostsUseCase = new GetPostsUseCase(postRepository);
const getPostByIdUseCase = new GetPostByIdUseCase(postRepository);
const updatePostUseCase = new UpdatePostUseCase(postRepository);
const deletePostUseCase = new DeletePostUseCase(postRepository);
const votePostUseCase = new VotePostUseCase(postRepository);
const savePostUseCase = new SavePostUseCase(postRepository);

const postController = new PostController(
    createPostUseCase,
    getPostsUseCase,
    getPostByIdUseCase,
    updatePostUseCase,
    deletePostUseCase,
    votePostUseCase,
    savePostUseCase
);

// Routes
import postRouter from './presentation/routes';

export { postRouter, postController };
