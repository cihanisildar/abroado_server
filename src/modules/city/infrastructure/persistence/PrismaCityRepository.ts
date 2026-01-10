import { PrismaClient } from '@prisma/client';
import { ICityRepository } from '../../domain/ICityRepository';
import { City } from '../../domain/City';
import { CityMapper } from './CityMapper';

export class PrismaCityRepository implements ICityRepository {
    constructor(private prisma: PrismaClient) { }

    async findById(id: string): Promise<City | null> {
        const city = await this.prisma.city.findUnique({ where: { id } });
        return city ? CityMapper.toDomain(city) : null;
    }

    async findBySlug(slug: string): Promise<City | null> {
        const city = await this.prisma.city.findUnique({ where: { slug } });
        return city ? CityMapper.toDomain(city) : null;
    }

    async create(city: City): Promise<City> {
        const persistenceData = CityMapper.toPersistence(city);
        // Ensure slug is present
        const slug = persistenceData.slug || `${city.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${city.id}`;

        const newCity = await this.prisma.city.create({
            data: {
                ...persistenceData,
                slug
            }
        });
        return CityMapper.toDomain(newCity);
    }

    async search(term: string): Promise<City[]> {
        const cities = await this.prisma.city.findMany({
            where: {
                name: { contains: term, mode: 'insensitive' }
            }
        });
        return cities.map(CityMapper.toDomain);
    }
}
