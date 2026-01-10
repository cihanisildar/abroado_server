import { prisma } from '../../lib/prisma';
import { PrismaCityReviewRepository } from './infrastructure/persistence/PrismaCityReviewRepository';
import { cityRepository } from '../city';

import { CreateCityReviewUseCase } from './application/use-cases/CreateCityReviewUseCase';
import { GetCityReviewsUseCase } from './application/use-cases/GetCityReviewsUseCase';
import { GetCityReviewByIdUseCase } from './application/use-cases/GetCityReviewByIdUseCase';
import { UpdateCityReviewUseCase } from './application/use-cases/UpdateCityReviewUseCase';
import { DeleteCityReviewUseCase } from './application/use-cases/DeleteCityReviewUseCase';
import { VoteCityReviewUseCase } from './application/use-cases/VoteCityReviewUseCase';
import { SaveCityReviewUseCase } from './application/use-cases/SaveCityReviewUseCase';
import { GetReviewCountriesStatsUseCase } from './application/use-cases/GetReviewCountriesStatsUseCase';

import { CityReviewController } from './presentation/controllers/CityReviewController';

// Comments Infrastructure
import { PrismaCityReviewCommentRepository } from './infrastructure/persistence/PrismaCityReviewCommentRepository';
import { AddCityReviewCommentUseCase } from './application/use-cases/comment/AddCityReviewCommentUseCase';
import { GetCityReviewCommentsUseCase } from './application/use-cases/comment/GetCityReviewCommentsUseCase';

import { UpdateCityReviewCommentUseCase } from './application/use-cases/comment/UpdateCityReviewCommentUseCase';
import { DeleteCityReviewCommentUseCase } from './application/use-cases/comment/DeleteCityReviewCommentUseCase';
import { VoteCityReviewCommentUseCase } from './application/use-cases/comment/VoteCityReviewCommentUseCase';

const cityReviewRepository = new PrismaCityReviewRepository(prisma);
const cityReviewCommentRepository = new PrismaCityReviewCommentRepository(prisma);

const createCityReviewUseCase = new CreateCityReviewUseCase(cityReviewRepository, cityRepository);
const getCityReviewsUseCase = new GetCityReviewsUseCase(cityReviewRepository);
const getCityReviewByIdUseCase = new GetCityReviewByIdUseCase(cityReviewRepository);
const updateCityReviewUseCase = new UpdateCityReviewUseCase(cityReviewRepository);
const deleteCityReviewUseCase = new DeleteCityReviewUseCase(cityReviewRepository);
const voteCityReviewUseCase = new VoteCityReviewUseCase(cityReviewRepository);
const saveCityReviewUseCase = new SaveCityReviewUseCase(cityReviewRepository);
const getReviewCountriesStatsUseCase = new GetReviewCountriesStatsUseCase(cityReviewRepository);

// Comment Use Cases
const addCityReviewCommentUseCase = new AddCityReviewCommentUseCase(cityReviewCommentRepository, cityReviewRepository);
const getCityReviewCommentsUseCase = new GetCityReviewCommentsUseCase(cityReviewCommentRepository);
const updateCityReviewCommentUseCase = new UpdateCityReviewCommentUseCase(cityReviewCommentRepository);
const deleteCityReviewCommentUseCase = new DeleteCityReviewCommentUseCase(cityReviewCommentRepository, cityReviewRepository);
const voteCityReviewCommentUseCase = new VoteCityReviewCommentUseCase(cityReviewCommentRepository);

const cityReviewController = new CityReviewController(
    createCityReviewUseCase,
    getCityReviewsUseCase,
    getCityReviewByIdUseCase,
    updateCityReviewUseCase,
    deleteCityReviewUseCase,
    voteCityReviewUseCase,
    saveCityReviewUseCase,
    getReviewCountriesStatsUseCase,
    getCityReviewCommentsUseCase,
    addCityReviewCommentUseCase,
    updateCityReviewCommentUseCase,
    deleteCityReviewCommentUseCase,
    voteCityReviewCommentUseCase
);

// Routes
import cityReviewRouter from './presentation/routes';
import cityReviewCommentRouter from './presentation/routes/commentRoutes';

export {
    cityReviewController,
    cityReviewRepository,
    cityReviewRouter,
    cityReviewCommentRouter,
    cityReviewCommentRepository,
    createCityReviewUseCase,
    getCityReviewsUseCase,
    getCityReviewByIdUseCase,
    updateCityReviewUseCase,
    deleteCityReviewUseCase,
    voteCityReviewUseCase,
    saveCityReviewUseCase,
    getReviewCountriesStatsUseCase,
    addCityReviewCommentUseCase,
    getCityReviewCommentsUseCase,
    updateCityReviewCommentUseCase,
    deleteCityReviewCommentUseCase,
    voteCityReviewCommentUseCase
};
