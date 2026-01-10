import { Request, Response } from 'express';
import { CreateRoomUseCase } from '../../application/use-cases/CreateRoomUseCase';
import { GetRoomsUseCase } from '../../application/use-cases/GetRoomsUseCase';
import { GetRoomByIdUseCase } from '../../application/use-cases/GetRoomByIdUseCase';
import { JoinRoomUseCase } from '../../application/use-cases/JoinRoomUseCase';
import { LeaveRoomUseCase } from '../../application/use-cases/LeaveRoomUseCase';
import { GetMessagesUseCase } from '../../application/use-cases/GetMessagesUseCase';
import { SendMessageUseCase } from '../../application/use-cases/SendMessageUseCase';
import { GetRoomCountriesStatsUseCase } from '../../application/use-cases/GetRoomCountriesStatsUseCase';
import { getAuthenticatedUserId, getOptionalAuthenticatedUserId } from '../../../../utils/authHelpers';
import { getOnlineMembersForRoom } from '../../infrastructure/SocketService';
import {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    RoomSchema,
    RoomQuerySchema,
    IdSchema,
    PaginationSchema,
    validateRequest,
    validateQuery,
    validateParams
} from '../../../../types';
import { prisma } from '../../../../lib/prisma';

export class RoomController {
    constructor(
        private createRoomUseCase: CreateRoomUseCase,
        private getRoomsUseCase: GetRoomsUseCase,
        private getRoomByIdUseCase: GetRoomByIdUseCase,
        private joinRoomUseCase: JoinRoomUseCase,
        private leaveRoomUseCase: LeaveRoomUseCase,
        private getMessagesUseCase: GetMessagesUseCase,
        private sendMessageUseCase: SendMessageUseCase,
        private getRoomCountriesStatsUseCase: GetRoomCountriesStatsUseCase
    ) { }

    public createRoom = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(createErrorResponse('Authentication required'));
                return;
            }

            const validation = validateRequest(RoomSchema, req.body);
            if (!validation.success) {
                res.status(400).json(createErrorResponse('Validation failed', validation.error));
                return;
            }

            const room = await this.createRoomUseCase.execute(getAuthenticatedUserId(req), validation.data as any);

            res.status(201).json(createSuccessResponse('Room created successfully', { ...room.toJSON(), onlineMembers: [] }));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to create room', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getRooms = async (req: Request, res: Response): Promise<void> => {
        try {
            const queryValidation = validateQuery(RoomQuerySchema, req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
                return;
            }

            const userId = getOptionalAuthenticatedUserId(req);
            const result = await this.getRoomsUseCase.execute(queryValidation.data as any, userId);

            res.json(createPaginatedResponse(result.rooms, result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch rooms', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getRoomById = async (req: Request, res: Response): Promise<void> => {
        try {
            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
                return;
            }

            const userId = getOptionalAuthenticatedUserId(req);
            const roomId = paramsValidation.data.id;
            const room = await this.getRoomByIdUseCase.execute(roomId, userId);

            // Fetch online members for the room
            const onlineMembers = await getOnlineMembersForRoom(prisma, roomId);

            res.json(createSuccessResponse('Room retrieved successfully', { ...room, onlineMembers }));
        } catch (error) {
            if (error instanceof Error) {
                if (error.message === 'Room not found') {
                    res.status(404).json(createErrorResponse('Room not found'));
                    return;
                }
                if (error.message === 'Invalid room ID') {
                    res.status(400).json(createErrorResponse('Invalid room ID'));
                    return;
                }
            }
            res.status(500).json(createErrorResponse('Failed to retrieve room', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public joinRoom = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(createErrorResponse('Authentication required'));
                return;
            }

            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
                return;
            }

            await this.joinRoomUseCase.execute(getAuthenticatedUserId(req), paramsValidation.data.id);

            res.json(createSuccessResponse('Joined room successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to join room', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public leaveRoom = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(createErrorResponse('Authentication required'));
                return;
            }

            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
                return;
            }

            await this.leaveRoomUseCase.execute(getAuthenticatedUserId(req), paramsValidation.data.id);

            res.json(createSuccessResponse('Left room successfully', null));
        } catch (error) {
            res.status(400).json(createErrorResponse('Failed to leave room', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(createErrorResponse('Authentication required'));
                return;
            }

            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
                return;
            }

            const queryValidation = validateQuery(PaginationSchema, req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
                return;
            }

            const result = await this.getMessagesUseCase.execute(
                paramsValidation.data.id,
                getAuthenticatedUserId(req),
                queryValidation.data
            );

            res.json(createPaginatedResponse(result.messages.map(m => m.toJSON()), result.pagination));
        } catch (error) {
            if (error instanceof Error && error.message === 'You are not a member of this room') {
                res.status(403).json(createErrorResponse(error.message));
                return;
            }
            res.status(500).json(createErrorResponse('Failed to fetch messages', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getRoomsWithMembersAndMessages = async (req: Request, res: Response): Promise<void> => {
        try {
            const queryValidation = validateQuery(RoomQuerySchema, req.query);
            if (!queryValidation.success) {
                res.status(400).json(createErrorResponse('Invalid query parameters', queryValidation.error));
                return;
            }

            const userId = getOptionalAuthenticatedUserId(req);
            const result = await this.getRoomsUseCase.executeWithMembersAndMessages(queryValidation.data as any, userId);

            res.json(createPaginatedResponse(result.rooms, result.pagination));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch rooms with members and messages', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public sendMessage = async (req: Request, res: Response): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json(createErrorResponse('Authentication required'));
                return;
            }

            const paramsValidation = validateParams(IdSchema, req.params);
            if (!paramsValidation.success) {
                res.status(400).json(createErrorResponse('Invalid room ID', paramsValidation.error));
                return;
            }

            const { content } = req.body;
            if (!content || typeof content !== 'string' || content.trim() === '') {
                res.status(400).json(createErrorResponse('Message content is required'));
                return;
            }

            const message = await this.sendMessageUseCase.execute(
                getAuthenticatedUserId(req),
                paramsValidation.data.id,
                content
            );

            res.status(201).json(createSuccessResponse('Message sent successfully', message.toJSON()));
        } catch (error) {
            if (error instanceof Error && error.message === 'You are not a member of this room') {
                res.status(403).json(createErrorResponse(error.message));
                return;
            }
            res.status(500).json(createErrorResponse('Failed to send message', error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    public getCountriesStats = async (req: Request, res: Response): Promise<void> => {
        try {
            const data = await this.getRoomCountriesStatsUseCase.execute();
            res.json(createSuccessResponse('Countries retrieved successfully', data));
        } catch (error) {
            res.status(500).json(createErrorResponse('Failed to fetch countries', error instanceof Error ? error.message : 'Unknown error'));
        }
    };
}
