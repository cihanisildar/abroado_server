import { prisma } from '../../lib/prisma';
import { PrismaCityRepository } from './infrastructure/persistence/PrismaCityRepository';
import { CsvCityCatalog } from './infrastructure/persistence/CsvCityCatalog';
import { EnsureCityExistsUseCase } from './application/use-cases/EnsureCityExistsUseCase';
import { SearchCitiesUseCase } from './application/use-cases/SearchCitiesUseCase';
import { GetCountriesUseCase } from './application/use-cases/GetCountriesUseCase';
import { CityController } from './presentation/controllers/CityController';

// Infrastructure
const cityRepository = new PrismaCityRepository(prisma);
const cityCatalog = new CsvCityCatalog();

// Use Cases
const ensureCityExistsUseCase = new EnsureCityExistsUseCase(cityRepository, cityCatalog);
const searchCitiesUseCase = new SearchCitiesUseCase(cityCatalog);
const getCountriesUseCase = new GetCountriesUseCase(cityCatalog);

// Controller
const cityController = new CityController(searchCitiesUseCase, getCountriesUseCase);

// Routes
import cityRouter from './presentation/routes';

export {
    cityController,
    cityRouter,
    ensureCityExistsUseCase,
    searchCitiesUseCase,
    getCountriesUseCase,
    cityRepository
};
