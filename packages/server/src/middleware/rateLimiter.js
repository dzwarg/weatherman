import rateLimit from 'express-rate-limit';
import { RATE_LIMITS } from '../config/constants.js';

/**
 * Rate limiter for weather API endpoints
 * Limits: 100 requests per 15 minutes per IP
 */
export const weatherApiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.WEATHER_API.windowMs,
  max: RATE_LIMITS.WEATHER_API.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to weather API. Please try again later.',
      details: {
        retryAfter: Math.ceil(RATE_LIMITS.WEATHER_API.windowMs / 1000),
      },
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Rate limiter for recommendations API endpoints
 * Limits: 500 requests per 15 minutes per IP
 */
export const recommendationsApiRateLimiter = rateLimit({
  windowMs: RATE_LIMITS.RECOMMENDATIONS_API.windowMs,
  max: RATE_LIMITS.RECOMMENDATIONS_API.max,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests to recommendations API. Please try again later.',
      details: {
        retryAfter: Math.ceil(RATE_LIMITS.RECOMMENDATIONS_API.windowMs / 1000),
      },
    },
    timestamp: new Date().toISOString(),
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export default {
  weatherApiRateLimiter,
  recommendationsApiRateLimiter,
};
