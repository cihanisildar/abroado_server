import { Router } from 'express';
import { postController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { postLimiter, generalLimiter } from '../../../../middleware/rateLimiter';
import { postImagesUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Post routes
router.get('/', generalLimiter, optionalAuth, cacheMiddleware(300), (req, res, next) => {
    /* #swagger.path = '/api/posts'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Get all posts'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/Post' } }
       }
    */
    postController.getPosts(req, res);
});

router.post(
    '/',
    authenticateToken,
    postLimiter,
    postImagesUpload.array('images', 5),
    invalidateMiddleware(['/api/posts', '/api/users/with-activity']),
    (req, res) => {
        /* #swagger.path = '/api/posts'
           #swagger.tags = ['Posts']
           #swagger.summary = 'Create a new post'
           #swagger.security = [{ "bearerAuth": [] }]
           #swagger.parameters['body'] = {
                in: 'body',
                schema: { 
                    title: 'Post title',
                    content: 'Post content',
                    tags: ['VISA', 'HOUSING']
                }
           }
        */
        postController.createPost(req, res);
    }
);

router.get('/:id', generalLimiter, optionalAuth, cacheMiddleware(3600), (req, res) => {
    /* #swagger.path = '/api/posts/{id}'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Get post by ID'
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/Post' }
       }
    */
    postController.getPostById(req, res);
});

router.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts', '/api/users/with-activity']), (req, res) => {
    /* #swagger.path = '/api/posts/{id}'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Update a post'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    postController.updatePost(req, res);
});

router.delete('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts', '/api/users/with-activity']), (req, res) => {
    /* #swagger.path = '/api/posts/{id}'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Delete a post'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    postController.deletePost(req, res);
});

// Post voting
router.post('/:id/upvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), (req, res) => {
    /* #swagger.path = '/api/posts/{id}/upvote'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Upvote a post'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    postController.upvotePost(req, res);
});

router.post('/:id/downvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), (req, res) => {
    /* #swagger.path = '/api/posts/{id}/downvote'
       #swagger.tags = ['Posts']
       #swagger.summary = 'Downvote a post'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    postController.downvotePost(req, res);
});

export default router;
