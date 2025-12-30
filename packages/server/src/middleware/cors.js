import cors from 'cors';
import { config } from '../config/env.js';

/**
 * CORS configuration middleware
 * Allows frontend to communicate with server
 */

/**
 * Get allowed origins based on environment
 * Supports comma-separated list of origins in production
 */
function getAllowedOrigins() {
  if (config.nodeEnv === 'development') {
    return [
      'http://localhost:5173',
      'https://localhost:5173',
      'http://localhost:4173',
      'https://localhost:4173',
    ];
  }

  // Production: Parse comma-separated ALLOWED_ORIGINS or use FRONTEND_URL
  // Example: ALLOWED_ORIGINS=https://weatherman.app,https://www.weatherman.app
  const allowedOriginsEnv = process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'https://weatherman.app';
  return allowedOriginsEnv.split(',').map((origin) => origin.trim());
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = getAllowedOrigins();

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log CORS rejection in development for debugging
    if (config.nodeEnv === 'development') {
      console.warn(`CORS rejected origin: ${origin}`);
      console.warn(`Allowed origins: ${allowedOrigins.join(', ')}`);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
