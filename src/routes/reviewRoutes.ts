import { Router } from 'express';
import * as cityController from '../controllers/CityController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { generalLimiter, reviewLimiter } from '../middleware/rateLimiter';
import { cacheMiddleware, invalidateMiddleware } from '../middleware/cache';

const router = Router();

// ---------------------------------------------------------------------------
// List all reviews (optional authentication for saved/vote info)
router.get('/', optionalAuth, generalLimiter, cacheMiddleware(300), cityController.getAllCityReviews);
router.get('/all', optionalAuth, generalLimiter, cacheMiddleware(300), cityController.getAllCityReviews); // alias

// Countries where reviews exist
router.get('/countries', generalLimiter, cacheMiddleware(86400), cityController.getReviewCountriesStats);

// ---------------------------------------------------------------------------
// Review CRUD
router.get('/:reviewId', optionalAuth, generalLimiter, cacheMiddleware(3600), cityController.getReviewById);
router.put('/:reviewId', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityController.updateReview);
router.delete('/:reviewId', authenticateToken, generalLimiter, invalidateMiddleware(['/api/cities', '/api/reviews']), cityController.deleteReview);

// Voting
router.post('/:reviewId/upvote', authenticateToken, generalLimiter, cityController.upvoteCityReview);
router.post('/:reviewId/downvote', authenticateToken, generalLimiter, cityController.downvoteCityReview);
router.delete('/:reviewId/vote', authenticateToken, generalLimiter, cityController.removeVoteFromCityReview);

// Save / Unsave
router.post('/:reviewId/save', authenticateToken, generalLimiter, cityController.saveCityReview);
router.delete('/:reviewId/save', authenticateToken, generalLimiter, cityController.unsaveCityReview);

// Comments on a review
router.get('/:id/comments', generalLimiter, optionalAuth, cacheMiddleware(300), cityController.getCityReviewComments);
router.post('/:id/comments', authenticateToken, generalLimiter, cityController.addCityReviewComment);

export default router; 