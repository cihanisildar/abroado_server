import { City } from './City';

export interface ICityRepository {
    findById(id: string): Promise<City | null>;
    findBySlug(slug: string): Promise<City | null>;
    create(city: City): Promise<City>;
    search(term: string): Promise<City[]>;
}

export interface ICityCatalog {
    findById(id: string): Promise<City | null>;
    search(query: any): Promise<{ cities: City[]; pagination: any }>;
    getAllCountries(): Promise<{ name: string }[]>;
}
