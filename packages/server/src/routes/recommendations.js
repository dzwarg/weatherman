import express from 'express';
import { getRecommendations, getProfiles } from '../controllers/recommendationsController.js';
import { recommendationsApiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all recommendation routes
router.use(recommendationsApiRateLimiter);

// Recommendation endpoints
router.post('/recommendations', getRecommendations);
router.get('/recommendations/profiles', getProfiles);

export { router as recommendationsRouter };
export default router;
