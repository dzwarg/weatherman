import express from 'express';
import { getCurrentWeather, getWeatherForecast } from '../controllers/weatherController.js';
import { weatherApiRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all weather routes
router.use(weatherApiRateLimiter);

// Weather endpoints
router.post('/weather/current', getCurrentWeather);
router.post('/weather/forecast', getWeatherForecast);

export { router as weatherRouter };
export default router;
