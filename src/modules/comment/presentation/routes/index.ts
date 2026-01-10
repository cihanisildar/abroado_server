import { Router } from 'express';
import { commentController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Comment routes
router.get('/', optionalAuth, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/comments'
       #swagger.tags = ['Comments']
       #swagger.summary = 'Get all comments'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/Comment' } }
       }
    */
    commentController.getPostComments(req, res);
});

router.post('/', authenticateToken, invalidateMiddleware(['/api/comments', '/api/posts']), (req, res) => {
    /* #swagger.path = '/api/comments'
       #swagger.tags = ['Comments']
       #swagger.summary = 'Post a new comment'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { $ref: '#/definitions/Comment' }
       }
    */
    commentController.addComment(req, res);
});

router.delete('/:id', authenticateToken, invalidateMiddleware(['/api/comments', '/api/posts']), (req, res) => {
    /* #swagger.path = '/api/comments/{id}'
       #swagger.tags = ['Comments']
       #swagger.summary = 'Delete a comment'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    commentController.deleteComment(req, res);
});

export default router;
