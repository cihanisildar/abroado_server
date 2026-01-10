import { Router } from 'express';
import { userController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { avatarUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// User list routes
router.get('/', generalLimiter, cacheMiddleware(300), userController.getUsers);
router.get('/with-activity', generalLimiter, cacheMiddleware(300), userController.getUsersWithActivity);

// User-specific routes
router.get('/:id', generalLimiter, cacheMiddleware(3600), userController.getUserById);
router.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/users']), userController.updateUser);
router.post('/:id/avatar', authenticateToken, avatarUpload.single('avatar'), invalidateMiddleware(['/api/users']), userController.uploadAvatar);

// User activities
router.get('/:id/comments', generalLimiter, optionalAuth, cacheMiddleware(300), userController.getUserComments);
router.get('/:id/saved-posts', generalLimiter, optionalAuth, cacheMiddleware({ ttl: 300, isPrivate: true }), userController.getSavedPosts);
router.get('/:id/saved-reviews', generalLimiter, optionalAuth, cacheMiddleware({ ttl: 300, isPrivate: true }), userController.getSavedCityReviews);
router.get('/:id/upvoted-posts', generalLimiter, optionalAuth, cacheMiddleware({ ttl: 300, isPrivate: true }), userController.getUpvotedPosts);
router.get('/:id/city-reviews', generalLimiter, optionalAuth, cacheMiddleware(300), userController.getUserCityReviews);

export default router;
