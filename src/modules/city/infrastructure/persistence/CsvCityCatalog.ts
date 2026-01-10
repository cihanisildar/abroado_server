import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { ICityCatalog } from '../../domain/ICityRepository';
import { City } from '../../domain/City';
import { CityMapper } from './CityMapper';

export class CsvCityCatalog implements ICityCatalog {
    private cache: any[] = [];
    private cacheTimestamp: number = 0;
    private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    private loadData() {
        const now = Date.now();
        if (this.cache.length > 0 && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
            return;
        }

        try {
            const csvPath = path.join(process.cwd(), 'src', 'utils', 'world-cities.csv');
            const fileContent = fs.readFileSync(csvPath, 'utf-8');

            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true
            });

            this.cache = records;
            this.cacheTimestamp = now;
        } catch (error) {
            console.error('Error loading CSV data:', error);
            throw new Error('Failed to load city data');
        }
    }

    async findById(id: string): Promise<City | null> {
        this.loadData();
        const record = this.cache.find((r: any) => r.geonameid === id);
        return record ? CityMapper.fromCsv(record) : null;
    }

    async search(query: any): Promise<{ cities: City[]; pagination: any }> {
        this.loadData();
        let filtered = [...this.cache];

        if (query.country) {
            filtered = filtered.filter(city => city.country === query.country);
        }

        if (query.search) {
            const term = query.search.toLowerCase();
            filtered = filtered.filter(city => city.name.toLowerCase().includes(term));
        }

        filtered.sort((a, b) => a.name.localeCompare(b.name));

        const page = Math.max(1, Number(query.page || 1));
        const limit = query.limit ? Math.max(1, Number(query.limit)) : filtered.length;
        const skip = (page - 1) * limit;

        // Only paginate if pagination is specifically requested (limit > 0)
        const paged = limit > 0 ? filtered.slice(skip, skip + limit) : filtered;

        return {
            cities: paged.map(record => CityMapper.fromCsv(record)),
            pagination: {
                page,
                limit,
                total: filtered.length,
                pages: limit === 0 ? 1 : Math.ceil(filtered.length / limit)
            }
        };
    }

    async getAllCountries(): Promise<{ name: string }[]> {
        this.loadData();
        const countries = new Set(this.cache.map(city => city.country));
        return Array.from(countries).sort().map(name => ({ name }));
    }
}
