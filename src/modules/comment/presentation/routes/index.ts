import { Router } from 'express';
import { commentController } from '../../index';
import { authenticateToken } from '../../../../middleware/auth';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// Comment actions
router.post('/:id/upvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.upvoteComment);
router.post('/:id/downvote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.downvoteComment);
router.delete('/:id/vote', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.removeVote);

// Comment management
router.put('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.updateComment);
router.delete('/:id', authenticateToken, generalLimiter, invalidateMiddleware(['/api/posts']), commentController.deleteComment);

export default router;
