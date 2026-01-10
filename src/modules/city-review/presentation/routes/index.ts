import { Router } from 'express';
import { cityReviewController } from '../../index';
import { authenticateToken, optionalAuth } from '../../../../middleware/auth';
import { cacheMiddleware, invalidateMiddleware } from '../../../../middleware/cache';

const router = Router();

// City review routes
router.get('/', optionalAuth, cacheMiddleware(300), (req, res) => {
    /* #swagger.path = '/api/reviews'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Get all city reviews'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/CityReview' } }
       }
    */
    cityReviewController.getAllCityReviews(req, res);
});

router.post('/', authenticateToken, invalidateMiddleware(['/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/reviews'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Submit a city review'
       #swagger.security = [{ "bearerAuth": [] }]
       #swagger.parameters['body'] = {
            in: 'body',
            schema: { $ref: '#/definitions/CityReview' }
       }
    */
    cityReviewController.createCityReview(req, res);
});

router.get('/:id', optionalAuth, cacheMiddleware(3600), (req, res) => {
    /* #swagger.path = '/api/reviews/{id}'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Get city review by ID'
       #swagger.responses[200] = {
            schema: { $ref: '#/definitions/CityReview' }
       }
    */
    cityReviewController.getReviewById(req, res);
});

router.put('/:id', authenticateToken, invalidateMiddleware(['/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/reviews/{id}'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Update a city review'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.updateReview(req, res);
});

router.delete('/:id', authenticateToken, invalidateMiddleware(['/api/reviews']), (req, res) => {
    /* #swagger.path = '/api/reviews/{id}'
       #swagger.tags = ['Reviews']
       #swagger.summary = 'Delete a city review'
       #swagger.security = [{ "bearerAuth": [] }]
    */
    cityReviewController.deleteReview(req, res);
});

export default router;
