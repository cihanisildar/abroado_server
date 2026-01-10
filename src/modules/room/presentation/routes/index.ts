import { Router } from 'express';
import { roomController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { generalLimiter, chatLimiter } from '../../../../middleware/rateLimiter';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Room list routes
router.get('/', generalLimiter, optionalAuth, cacheMiddleware(300), roomController.getRooms);
router.get('/with-members-messages', generalLimiter, optionalAuth, cacheMiddleware(300), roomController.getRoomsWithMembersAndMessages);
router.get('/countries', generalLimiter, cacheMiddleware(3600), roomController.getCountriesStats);

// Room-specific routes
router.post('/', authenticateToken, generalLimiter, invalidateMiddleware(['/api/rooms']), roomController.createRoom);
router.get('/:id', generalLimiter, optionalAuth, cacheMiddleware(3600), roomController.getRoomById);
router.post('/:id/join', authenticateToken, generalLimiter, roomController.joinRoom);
router.post('/:id/leave', authenticateToken, generalLimiter, roomController.leaveRoom);

// Message routes
router.get('/:id/messages', authenticateToken, chatLimiter, roomController.getMessages);
router.post('/:id/messages', authenticateToken, chatLimiter, roomController.sendMessage);

export default router;
