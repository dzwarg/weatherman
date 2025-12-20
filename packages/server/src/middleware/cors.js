import cors from 'cors';
import { config } from '../config/env.js';

/**
 * CORS configuration middleware
 * Allows frontend to communicate with server
 */

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Development mode - allow localhost origins
    if (config.nodeEnv === 'development') {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://localhost:5173',
        'http://localhost:4173',
        'https://localhost:4173',
      ];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
    }

    // Production mode - allow configured origin
    const allowedOrigin = process.env.FRONTEND_URL || 'https://weatherman.app';
    if (origin === allowedOrigin) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
