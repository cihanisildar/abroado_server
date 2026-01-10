import { Router } from 'express';
import { postController } from '../../index';
import { commentController } from '../../../comment';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { generalLimiter, postLimiter } from '../../../../middleware/rateLimiter';
import { postImagesUpload } from '../../../../middleware/upload';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Post routes
router.get('/', generalLimiter, optionalAuth, cacheMiddleware(300), postController.getPosts);

router.post(
    '/',
    authenticateToken,
    postLimiter,
    postImagesUpload.array('images', 5),
    invalidateMiddleware(['/api/posts', '/api/users/with-activity']),
    postController.createPost
);

router.get('/:id', generalLimiter, optionalAuth, cacheMiddleware(3600), postController.getPostById);
router.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts', '/api/users/with-activity']), postController.updatePost);
router.delete('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts', '/api/users/with-activity']), postController.deletePost);

// Post voting
router.post('/:id/upvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), postController.upvotePost);
router.post('/:id/downvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), postController.downvotePost);
router.delete('/:id/vote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), postController.removeVote);

// Post saving
router.post('/:id/save', authenticateToken, generalLimiter, invalidateMiddleware(['/api/users']), postController.savePost);
router.delete('/:id/save', authenticateToken, generalLimiter, invalidateMiddleware(['/api/users']), postController.unsavePost);

// Comments (via Comment Module)
router.get('/:id/comments', generalLimiter, optionalAuth, cacheMiddleware(300), commentController.getPostComments);
router.post('/:id/comments', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.addComment);

export default router;
