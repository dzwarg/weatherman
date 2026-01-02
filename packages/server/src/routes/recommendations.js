import express from 'express';
import { getRecommendations, getProfiles } from '../controllers/recommendationsController.js';
import { recommendationsApiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all recommendation routes
router.use(recommendationsApiRateLimiter);

// Recommendation endpoints
router.post('/recommendations', getRecommendations);
router.get('/recommendations/profiles', getProfiles);

// Return 405 Method Not Allowed for unsupported methods on /recommendations
router.all('/recommendations', (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).set('Allow', 'POST').json({
      error: 'Method Not Allowed',
      message: `${req.method} method is not supported for this endpoint. Use POST instead.`,
      allowedMethods: ['POST']
    });
  }
});

export { router as recommendationsRouter };
export default router;
