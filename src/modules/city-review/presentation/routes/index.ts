import { Router } from 'express';
import { cityReviewController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Review list routes
router.get('/', optionalAuth, generalLimiter, cacheMiddleware(300), cityReviewController.getAllCityReviews);
router.get('/all', optionalAuth, generalLimiter, cacheMiddleware(300), cityReviewController.getAllCityReviews); // alias
router.get('/countries', generalLimiter, cacheMiddleware(86400), cityReviewController.getReviewCountriesStats);

// Review-specific routes
router.get('/:reviewId', optionalAuth, generalLimiter, cacheMiddleware(3600), cityReviewController.getReviewById);
router.put('/:reviewId', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.updateReview);
router.delete('/:reviewId', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityReviewController.deleteReview);

// Review voting
router.post('/:reviewId/upvote', authenticateToken, generalLimiter, cityReviewController.upvoteCityReview);
router.post('/:reviewId/downvote', authenticateToken, generalLimiter, cityReviewController.downvoteCityReview);
router.delete('/:reviewId/vote', authenticateToken, generalLimiter, cityReviewController.removeVoteFromCityReview);

// Review saving
router.post('/:reviewId/save', authenticateToken, generalLimiter, cityReviewController.saveCityReview);
router.delete('/:reviewId/save', authenticateToken, generalLimiter, cityReviewController.unsaveCityReview);

// Review comments
router.get('/:id/comments', generalLimiter, optionalAuth, cacheMiddleware(300), cityReviewController.getCityReviewComments);
router.post('/:id/comments', authenticateToken, generalLimiter, cityReviewController.addCityReviewComment);

export default router;
