import { Router } from 'express';
import { cityController } from '../../index';
import { generalLimiter } from '../../../../middleware/rateLimiter';
import { cacheMiddleware } from '../../../../middleware/cache';

const router = Router();

// City routes
router.get('/', generalLimiter, cacheMiddleware(3600), cityController.getCities);
router.get('/countries', generalLimiter, cacheMiddleware(86400), cityController.getCountries);

export default router;
