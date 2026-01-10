import { ICityCatalog } from '../../domain/ICityRepository';

export class GetCountriesUseCase {
    constructor(private cityCatalog: ICityCatalog) { }

    async execute(): Promise<{ name: string }[]> {
        return await this.cityCatalog.getAllCountries();
    }
}
