import { Router } from 'express';
import { roomController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Room routes
router.get('/', optionalAuth, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/rooms'
       #swagger.tags = ['Rooms']
       #swagger.summary = 'Get all chat rooms'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/Room' } }
       }
    */
    roomController.getRooms(req, res);
});

router.post('/', authenticateToken, invalidateMiddleware(['/api/rooms']), (req, res) => {
    /* #swagger.path = '/api/rooms'
       #swagger.tags = ['Rooms']
       #swagger.summary = 'Create a new chat room'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { $ref: '#/definitions/Room' }
       }
    */
    roomController.createRoom(req, res);
});

router.get('/:id', optionalAuth, cacheMiddleware(3600), (req, res) => {
    /* #swagger.path = '/api/rooms/{id}'
       #swagger.tags = ['Rooms']
       #swagger.summary = 'Get chat room by ID'
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/Room' }
       }
    */
    roomController.getRoomById(req, res);
});

// Room members
router.post('/:id/join', authenticateToken, invalidateMiddleware(['/api/rooms']), (req, res) => {
    /* #swagger.path = '/api/rooms/{id}/join'
       #swagger.tags = ['Rooms']
       #swagger.summary = 'Join a chat room'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    roomController.joinRoom(req, res);
});

router.post('/:id/leave', authenticateToken, invalidateMiddleware(['/api/rooms']), (req, res) => {
    /* #swagger.path = '/api/rooms/{id}/leave'
       #swagger.tags = ['Rooms']
       #swagger.summary = 'Leave a chat room'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    roomController.leaveRoom(req, res);
});

export default router;
