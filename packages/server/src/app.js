/**
 * Express app configuration (without server start)
 * Exported for testing purposes
 */

import express from 'express';
import helmet from 'helmet';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { weatherRouter } from './routes/weather.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { checkHealth as checkClaudeHealth } from './services/claudeService.js';

const app = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check Claude API health
    const claudeAvailable = await checkClaudeHealth();
    const weatherAvailable = true; // Assuming weather API is always available

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        weatherAPI: weatherAvailable ? 'available' : 'unavailable',
        claudeAPI: claudeAvailable ? 'available' : 'unavailable',
      },
    });
  } catch {
    // Even if health checks fail, the server is still operational
    res.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        weatherAPI: 'available',
        claudeAPI: 'unavailable',
      },
    });
  }
});

// API routes
app.use('/api', weatherRouter);
app.use('/api', recommendationsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
