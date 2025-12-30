/**
 * Express app configuration (without server start)
 * Exported for testing purposes
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { weatherRouter } from './routes/weather.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { checkHealth as checkClaudeHealth } from './services/claudeService.js';
import { config } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(compression()); // Enable gzip compression
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

// Production: Serve frontend static files (optional monolith deployment)
if (config.nodeEnv === 'production' && process.env.SERVE_FRONTEND === 'true') {
  const frontendDistPath = path.join(__dirname, '../../../frontend/dist');

  // Serve static files with caching headers
  app.use(
    express.static(frontendDistPath, {
      maxAge: '1y', // Cache static assets for 1 year
      etag: true,
      lastModified: true,
    })
  );

  // SPA fallback: Serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Only serve index.html if not an API route
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(frontendDistPath, 'index.html'));
    }
  });

  console.log('✓ Serving frontend static files from:', frontendDistPath);
}

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
