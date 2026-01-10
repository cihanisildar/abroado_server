import { IRoomRepository } from '../../domain/IRoomRepository';

export class GetRoomCountriesStatsUseCase {
    constructor(private roomRepository: IRoomRepository) { }

    async execute(): Promise<{ country: string; count: number }[]> {
        return await this.roomRepository.getCountriesStats();
    }
}
