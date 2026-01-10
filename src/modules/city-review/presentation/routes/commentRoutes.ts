import { Router } from 'express';
import { cityReviewController } from '../../index';
import { authenticateToken } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { invalidateMiddleware } from '../../../../middleware/cache';

const commentRouter = Router();

// City review comment voting
commentRouter.post('/:id/upvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/city-review-comments/{id}/upvote'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Upvote a city review comment'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.upvoteCityReviewComment(req, res);
});

commentRouter.post('/:id/downvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/city-review-comments/{id}/downvote'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Downvote a city review comment'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.downvoteCityReviewComment(req, res);
});

commentRouter.delete('/:id/vote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/city-review-comments/{id}/vote'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Remove vote from city review comment'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.removeVoteFromCityReviewComment(req, res);
});

// City review comment management
commentRouter.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/city-review-comments/{id}'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Update city review comment'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { content: 'Updated comment content' }
       }
    */
    cityReviewController.updateCityReviewComment(req, res);
});

commentRouter.delete('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/city-review-comments/{id}'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Delete city review comment'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.deleteCityReviewComment(req, res);
});

export default commentRouter;
