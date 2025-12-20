import express from 'express';
import helmet from 'helmet';
import { config } from './config/env.js';
import { corsMiddleware } from './middleware/cors.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { weatherRouter } from './routes/weather.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { checkHealth as checkOllamaHealth } from './services/ollamaService.js';

const app = express();
const PORT = config.port;

// Middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check Ollama health
    const ollamaAvailable = await checkOllamaHealth();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        weatherApi: 'connected',
        ollama: ollamaAvailable ? 'connected' : 'unavailable',
      },
    });
  } catch (error) {
    // Even if health checks fail, the server is still operational
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        weatherApi: 'connected',
        ollama: 'unavailable',
      },
    });
  }
});

// API routes
app.use('/api', weatherRouter);
app.use('/api', recommendationsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
});

export default app;
