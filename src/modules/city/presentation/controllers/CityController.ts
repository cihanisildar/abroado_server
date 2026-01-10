import { Request, Response } from 'express';
import { SearchCitiesUseCase } from '../../application/use-cases/SearchCitiesUseCase';
import { GetCountriesUseCase } from '../../application/use-cases/GetCountriesUseCase';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
} from '../../../../types';

export class CityController {
    constructor(
        private searchCitiesUseCase: SearchCitiesUseCase,
        private getCountriesUseCase: GetCountriesUseCase
    ) { }

    public getCities = async (req: Request, res: Response): Promise<void> => {
        try {
            const result = await this.searchCitiesUseCase.execute(req.query);
            res.json(createPaginatedResponse(result.cities.map(c => c.toJSON()), result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch cities'));
        }
    };

    public getCountries = async (req: Request, res: Response): Promise<void> => {
        try {
            const countries = await this.getCountriesUseCase.execute();
            res.json(createSuccessResponse('Countries fetched successfully', countries));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch countries'));
        }
    };
}
