import { Router } from 'express';
import { cityController } from '../../index';
import { cacheMiddleware } from '../../../../middleware/cache';

const router = Router();

// City routes
router.get('/', cacheMiddleware(3600), (req, res) => {
    /* #swagger.path = '/api/cities'
       #swagger.tags = ['Cities']
       #swagger.summary = 'Get all cities'
       #swagger.responses[200] = {
            schema: { type: 'array', items: { $ref: '#/definitions/City' } }
       }
    */
    cityController.getCities(req, res);
});

router.get('/countries', cacheMiddleware(86400), (req, res) => {
    /* #swagger.path = '/api/cities/countries'
       #swagger.tags = ['Cities']
       #swagger.summary = 'Get all countries'
    */
    cityController.getCountries(req, res);
});

export default router;
