import { prisma } from '../../lib/prisma';
import { PrismaRoomRepository } from './infrastructure/persistence/PrismaRoomRepository';
import { PrismaMessageRepository } from './infrastructure/persistence/PrismaMessageRepository';
import { PrismaRoomMemberRepository } from './infrastructure/persistence/PrismaRoomMemberRepository';

import { CreateRoomUseCase } from './application/use-cases/CreateRoomUseCase';
import { GetRoomsUseCase } from './application/use-cases/GetRoomsUseCase';
import { GetRoomByIdUseCase } from './application/use-cases/GetRoomByIdUseCase';
import { JoinRoomUseCase } from './application/use-cases/JoinRoomUseCase';
import { LeaveRoomUseCase } from './application/use-cases/LeaveRoomUseCase';
import { GetMessagesUseCase } from './application/use-cases/GetMessagesUseCase';
import { SendMessageUseCase } from './application/use-cases/SendMessageUseCase';
import { GetRoomCountriesStatsUseCase } from './application/use-cases/GetRoomCountriesStatsUseCase';

import { RoomController } from './presentation/controllers/RoomController';

// Infrastructure
const roomRepository = new PrismaRoomRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const roomMemberRepository = new PrismaRoomMemberRepository(prisma);

// Use Cases
const createRoomUseCase = new CreateRoomUseCase(roomRepository, roomMemberRepository);
const getRoomsUseCase = new GetRoomsUseCase(roomRepository, roomMemberRepository);
const getRoomByIdUseCase = new GetRoomByIdUseCase(roomRepository, roomMemberRepository);
const joinRoomUseCase = new JoinRoomUseCase(roomRepository, roomMemberRepository);
const leaveRoomUseCase = new LeaveRoomUseCase(roomRepository, roomMemberRepository, prisma);
const getMessagesUseCase = new GetMessagesUseCase(messageRepository, roomMemberRepository);
const sendMessageUseCase = new SendMessageUseCase(messageRepository, roomMemberRepository);
const getRoomCountriesStatsUseCase = new GetRoomCountriesStatsUseCase(roomRepository);

// Controller
const roomController = new RoomController(
    createRoomUseCase,
    getRoomsUseCase,
    getRoomByIdUseCase,
    joinRoomUseCase,
    leaveRoomUseCase,
    getMessagesUseCase,
    sendMessageUseCase,
    getRoomCountriesStatsUseCase
);

// Routes
import roomRouter from './presentation/routes';

export {
    roomController,
    roomRepository,
    messageRepository,
    roomMemberRepository,
    roomRouter,
    createRoomUseCase,
    getRoomsUseCase,
    getRoomByIdUseCase,
    joinRoomUseCase,
    leaveRoomUseCase,
    getMessagesUseCase,
    sendMessageUseCase,
    getRoomCountriesStatsUseCase
};
