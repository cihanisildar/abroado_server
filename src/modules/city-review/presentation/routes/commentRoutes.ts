import { Router } from 'express';
import { cityReviewController } from '../../index';
import { authenticateToken } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { invalidateMiddleware } from '../../../../middleware/cache';

const commentRouter = Router();

// City review comment voting
commentRouter.post('/:id/upvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.upvoteCityReviewComment);
commentRouter.post('/:id/downvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.downvoteCityReviewComment);
commentRouter.delete('/:id/vote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.removeVoteFromCityReviewComment);

// City review comment management
commentRouter.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.updateCityReviewComment);
commentRouter.delete('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.deleteCityReviewComment);

export default commentRouter;
