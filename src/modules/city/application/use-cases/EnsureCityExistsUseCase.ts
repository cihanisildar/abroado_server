import { ICityRepository, ICityCatalog } from '../../domain/ICityRepository';
import { City } from '../../domain/City';

export class EnsureCityExistsUseCase {
    constructor(
        private cityRepository: ICityRepository,
        private cityCatalog: ICityCatalog
    ) { }

    async execute(id: string): Promise<City> {
        // 1. Check DB first
        let city = await this.cityRepository.findById(id);
        if (city) return city;

        // 2. If not in DB, check CSV Catalog
        city = await this.cityCatalog.findById(id);
        if (!city) {
            throw new Error(`City with ID ${id} not found`);
        }

        // 3. Persist to DB for future use
        return await this.cityRepository.create(city);
    }
}
