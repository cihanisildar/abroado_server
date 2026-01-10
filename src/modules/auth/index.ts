import { prisma } from '../../lib/prisma';
import { userRepository } from '../user';
import { TokenService } from './infrastructure/TokenService';

import { RegisterUseCase } from './application/use-cases/RegisterUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { LogoutUseCase } from './application/use-cases/LogoutUseCase';
import { RefreshTokenUseCase } from './application/use-cases/RefreshTokenUseCase';
import { GetProfileUseCase } from './application/use-cases/GetProfileUseCase';
import { UpdateProfileUseCase } from './application/use-cases/UpdateProfileUseCase';
import { GoogleAuthUseCase } from './application/use-cases/GoogleAuthUseCase';

import { AuthController } from './presentation/controllers/AuthController';
import { GoogleOAuthController } from './presentation/controllers/GoogleOAuthController';

// Infrastructure
const tokenService = new TokenService();

// Use Cases
const registerUseCase = new RegisterUseCase(userRepository, tokenService);
const loginUseCase = new LoginUseCase(userRepository, tokenService);
const logoutUseCase = new LogoutUseCase(userRepository);
const refreshTokenUseCase = new RefreshTokenUseCase(userRepository, tokenService);
const getProfileUseCase = new GetProfileUseCase(prisma);
const updateProfileUseCase = new UpdateProfileUseCase(prisma);
const googleAuthUseCase = new GoogleAuthUseCase(userRepository, tokenService);

// Controllers
const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    getProfileUseCase,
    updateProfileUseCase,
    googleAuthUseCase
);

const googleOAuthController = new GoogleOAuthController(authController);

// Routes
import authRouter from './presentation/routes';

export {
    authController,
    googleOAuthController,
    authRouter,
    tokenService,
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    getProfileUseCase,
    updateProfileUseCase,
    googleAuthUseCase
};
