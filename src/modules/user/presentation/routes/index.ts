import { Router } from 'express';
import { userController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { avatarUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// User list routes
router.get('/', generalLimiter, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/users'
       #swagger.tags = ['Users']
       #swagger.summary = 'Get all users'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/User' } }
       }
    */
    userController.getUsers(req, res);
});

router.get('/with-activity', generalLimiter, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/users/with-activity'
       #swagger.tags = ['Users']
       #swagger.summary = 'Get users with their activity'
    */
    userController.getUsersWithActivity(req, res);
});

// User-specific routes
router.get('/:id', generalLimiter, cacheMiddleware(3600), (req, res) => {
    /* #swagger.path = '/api/users/{id}'
       #swagger.tags = ['Users']
       #swagger.summary = 'Get user by ID'
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/User' }
       }
    */
    userController.getUserById(req, res);
});

router.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/users']), (req, res) => {
    /* #swagger.path = '/api/users/{id}'
       #swagger.tags = ['Users']
       #swagger.summary = 'Update user profile'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { $ref: '#/definitions/User' }
       }
    */
    userController.updateUser(req, res);
});

router.post('/:id/avatar', authenticateToken, avatarUpload.single('avatar'), invalidateMiddleware(['/api/users']), (req, res) => {
    /* #swagger.path = '/api/users/{id}/avatar'
       #swagger.tags = ['Users']
       #swagger.summary = 'Upload user avatar'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['avatar'] = { in: 'formData', type: 'file' }
    */
    userController.uploadAvatar(req, res);
});

// User activities
router.get('/:id/comments', generalLimiter, optionalAuth, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/users/{id}/comments'
       #swagger.tags = ['Users']
       #swagger.summary = 'Get user comments'
    */
    userController.getUserComments(req, res);
});

/* router.get('/:id/posts', generalLimiter, optionalAuth, cacheMiddleware(300), (req, res) => {
    // #swagger.path = '/api/users/{id}/posts'
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get user posts'
    userController.getUserPosts(req, res);
}); */

export default router;
