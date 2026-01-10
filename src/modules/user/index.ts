import { prisma } from '../../lib/prisma';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { GetUsersUseCase } from './application/use-cases/GetUsersUseCase';
import { GetUserByIdUseCase } from './application/use-cases/GetUserByIdUseCase';
import { UpdateUserUseCase } from './application/use-cases/UpdateUserUseCase';
import { UploadAvatarUseCase } from './application/use-cases/UploadAvatarUseCase';
import { UserController } from './presentation/controllers/UserController';

// Cross-module imports
import { postRepository } from '../post';
import { commentRepository } from '../comment';
// cityReviewRepository is exported from city-review module
import { cityReviewRepository } from '../city-review';

import { GetSavedPostsByUserUseCase } from '../post/application/use-cases/GetSavedPostsByUserUseCase';
import { GetUpvotedPostsByUserUseCase } from '../post/application/use-cases/GetUpvotedPostsByUserUseCase';
import { GetCommentsByUserUseCase } from '../comment/application/use-cases/GetCommentsByUserUseCase';
import { GetCityReviewsByUserUseCase } from '../city-review/application/use-cases/GetCityReviewsByUserUseCase';
import { GetSavedCityReviewsByUserUseCase } from '../city-review/application/use-cases/GetSavedCityReviewsByUserUseCase';

// User Module Infrastructure
const userRepository = new PrismaUserRepository(prisma);

// User Module Use Cases
const getUsersUseCase = new GetUsersUseCase(userRepository);
const getUserByIdUseCase = new GetUserByIdUseCase(userRepository);
const updateUserUseCase = new UpdateUserUseCase(userRepository);
const uploadAvatarUseCase = new UploadAvatarUseCase(userRepository);

// Cross-Module Use Cases (Instantiated here for User Controller)
const getSavedPostsByUserUseCase = new GetSavedPostsByUserUseCase(postRepository);
const getUpvotedPostsByUserUseCase = new GetUpvotedPostsByUserUseCase(postRepository);
const getCommentsByUserUseCase = new GetCommentsByUserUseCase(commentRepository);
const getCityReviewsByUserUseCase = new GetCityReviewsByUserUseCase(cityReviewRepository);
const getSavedCityReviewsByUserUseCase = new GetSavedCityReviewsByUserUseCase(cityReviewRepository);

// Controller
const userController = new UserController(
    getUsersUseCase,
    getUserByIdUseCase,
    updateUserUseCase,
    uploadAvatarUseCase,
    getSavedPostsByUserUseCase,
    getUpvotedPostsByUserUseCase,
    getCommentsByUserUseCase,
    getCityReviewsByUserUseCase,
    getSavedCityReviewsByUserUseCase
);

// Routes
import userRouter from './presentation/routes';

export {
    userController,
    userRepository,
    userRouter,
    getUsersUseCase,
    getUserByIdUseCase,
    updateUserUseCase,
    uploadAvatarUseCase
};
