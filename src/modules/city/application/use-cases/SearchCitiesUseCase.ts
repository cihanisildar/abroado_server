import { ICityCatalog } from '../../domain/ICityRepository';
import { City } from '../../domain/City';

export class SearchCitiesUseCase {
    constructor(private cityCatalog: ICityCatalog) { }

    async execute(query: any): Promise<{ cities: City[]; pagination: any }> {
        return await this.cityCatalog.search(query);
    }
}
