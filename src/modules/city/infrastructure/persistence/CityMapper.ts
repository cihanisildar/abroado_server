import { City as DomainCity } from '../../domain/City';
import { City as PrismaCity } from '@prisma/client';

export class CityMapper {
    public static toDomain(prismaCity: PrismaCity): DomainCity {
        return new DomainCity({
            id: prismaCity.id,
            name: prismaCity.name,
            country: prismaCity.country,
            slug: prismaCity.slug,
            createdAt: prismaCity.createdAt,
            updatedAt: prismaCity.updatedAt
        });
    }

    public static toPersistence(domainCity: DomainCity): any {
        return {
            id: domainCity.id,
            name: domainCity.name,
            country: domainCity.country,
            slug: domainCity.slug,
        };
    }

    public static fromCsv(record: any): DomainCity {
        return new DomainCity({
            id: record.id || record.geonameid,
            name: record.name,
            country: record.country,
            slug: record.slug || undefined
        });
    }
}
