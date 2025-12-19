# Express.js Server Architecture Best Practices
## Weather & Recommendation API Proxy Service

**Document Version:** 1.0
**Date:** 2025-12-19
**Context:** Backend API proxy server for Weatherman PWA application

---

## Executive Summary

This document outlines the recommended Express.js architecture for a weather and clothing recommendation API proxy service. The server will secure weather API credentials, implement rate limiting, provide dynamic recommendation endpoints, and handle CORS for local development and production deployment.

**Key Decisions:**
- Three-layer architecture (Web/Routes, Business Logic/Services, Data Access)
- express-validator for request validation
- express-rate-limit for API throttling
- Environment-based CORS configuration
- Vitest + Supertest for testing
- dotenv for local development, secrets managers for production

---

## 1. Recommended Express Architecture

### 1.1 Project Structure

```
weatherman/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── env.js              # Environment variable validation & export
│   │   │   ├── cors.js             # CORS configuration by environment
│   │   │   └── rateLimits.js       # Rate limiting configurations
│   │   ├── routes/
│   │   │   ├── index.js            # Route aggregator
│   │   │   ├── weather.routes.js   # Weather API proxy endpoints
│   │   │   ├── recommendations.routes.js  # Clothing recommendations
│   │   │   └── health.routes.js    # Health check endpoint
│   │   ├── controllers/
│   │   │   ├── weather.controller.js
│   │   │   └── recommendations.controller.js
│   │   ├── services/
│   │   │   ├── weatherAPI.service.js      # Weather API client
│   │   │   ├── outfitEngine.service.js    # Recommendation logic
│   │   │   └── cache.service.js           # Response caching
│   │   ├── middleware/
│   │   │   ├── errorHandler.js            # Global error handler
│   │   │   ├── validateRequest.js         # Validation middleware
│   │   │   ├── rateLimiter.js             # Rate limiting middleware
│   │   │   └── logger.js                  # Request logging
│   │   ├── validators/
│   │   │   ├── weather.validators.js
│   │   │   └── recommendations.validators.js
│   │   ├── utils/
│   │   │   ├── CustomError.js             # Custom error classes
│   │   │   ├── asyncHandler.js            # Async error wrapper
│   │   │   └── responseFormatter.js       # Consistent API responses
│   │   ├── app.js                         # Express app setup
│   │   └── server.js                      # Server initialization
│   ├── tests/
│   │   ├── integration/
│   │   │   ├── weather.test.js
│   │   │   └── recommendations.test.js
│   │   ├── unit/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── setup.js
│   ├── .env.example
│   ├── .env
│   ├── package.json
│   └── vitest.config.js
├── src/                              # React frontend (existing)
├── package.json                      # Root package.json
└── README.md
```

### 1.2 Three-Layer Architecture Pattern

**Why This Pattern:**
- **Separation of Concerns:** Each layer has a single, well-defined responsibility
- **Testability:** Business logic isolated from HTTP and data access concerns
- **Maintainability:** Changes to one layer don't cascade to others
- **Scalability:** Easy to swap implementations (e.g., different weather APIs)

**Layer Responsibilities:**

1. **Web Layer (Routes + Controllers + Middleware)**
   - HTTP request/response handling
   - Request validation
   - Rate limiting
   - CORS management
   - Error formatting

2. **Business Logic Layer (Services)**
   - Weather API integration
   - Outfit recommendation algorithm
   - Data transformation
   - Caching logic
   - No dependency on Express (no req/res objects)

3. **Data Access Layer (Services)**
   - Cache management (in-memory or Redis)
   - External API calls
   - Data persistence (if needed in future)

---

## 2. Decision Rationale

### 2.1 Why Express-Validator Over Manual Validation

**Decision:** Use express-validator for all request validation

**Rationale:**
- **Reliability:** Built on validator.js with extensive, battle-tested validators
- **Maintainability:** Declarative validation chains are easier to read and modify than imperative code
- **Security:** Includes built-in sanitization for XSS prevention
- **Developer Experience:** Chainable API reduces boilerplate
- **TypeScript Support:** Excellent type inference for validated data
- **Industry Standard:** Most widely used validation library (10M+ weekly downloads)

**Trade-offs:**
- ✅ Comprehensive built-in validators (email, URL, numeric ranges, etc.)
- ✅ Automatic error formatting and collection
- ✅ Sanitization included (trim, escape, normalize)
- ⚠️ Adds dependency (~500KB), but worth it for reliability
- ⚠️ Learning curve for advanced custom validators

**When to Use Manual Validation:**
- Simple string checks in utility functions
- Internal service-to-service validation
- Performance-critical paths (rare for API servers)

### 2.2 Why Express-Rate-Limit

**Decision:** Use express-rate-limit for all rate limiting

**Rationale:**
- **Proven Solution:** 10M+ weekly downloads, industry standard
- **Flexible Configuration:** Per-route, per-IP, sliding windows
- **Store Adapters:** Memory (default), Redis, Memcached for distributed systems
- **Weather API Protection:** Prevent exceeding external API quotas
- **DDoS Prevention:** Protect server from abuse

**Configuration Strategy:**
```javascript
// Aggressive limit for weather API (external cost concern)
weatherAPILimiter: 100 requests per 15 minutes per IP

// Generous limit for recommendations (internal computation)
recommendationsLimiter: 500 requests per 15 minutes per IP

// Strict limit for health checks (prevent monitoring abuse)
healthLimiter: 10 requests per minute per IP
```

### 2.3 Why Vitest + Supertest

**Decision:** Use Vitest as test runner with Supertest for HTTP testing

**Rationale:**
- **Performance:** Vitest is 1.5x faster than Jest with --pool=forks
- **Modern API:** Native ESM support, compatible with Vite frontend tooling
- **Developer Experience:** Built-in watch mode, UI dashboard, coverage reports
- **Supertest Compatibility:** Works seamlessly with existing Express patterns
- **Consistency:** Same test framework for frontend (Vitest) and backend

**Alternative Considered:**
- **Fetch/Axios + Vitest:** Some developers prefer pure HTTP clients, but Supertest provides:
  - Built-in app bootstrapping (no need to start server)
  - Chainable assertions specific to HTTP
  - Better error messages for HTTP failures
  - Proven pattern in Express community

### 2.4 Environment Variable Management

**Decision:** dotenv for development, native Node.js + secrets managers for production

**Rationale:**
- **Development:** dotenv is simple, familiar, and works well for local .env files
- **Production:** Node.js 20.6.0+ has native .env support (`--env-file` flag)
- **Security:** Never commit .env to git; use secrets managers (AWS Secrets Manager, Vault) for production
- **Modern Best Practice (2025):** Transition away from dotenv in production environments

**Implementation:**
```json
// package.json scripts
{
  "dev": "node --env-file=.env src/server.js",
  "start": "node src/server.js"  // production uses env vars from hosting platform
}
```

---

## 3. Code Examples

### 3.1 Server Setup (server.js)

```javascript
// server/src/server.js
import app from './app.js';
import { PORT, NODE_ENV } from './config/env.js';

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

### 3.2 Express App Configuration (app.js)

```javascript
// server/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { corsOptions } from './config/cors.js';
import { requestLogger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Endpoint not found',
      path: req.path
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
```

### 3.3 Environment Configuration (config/env.js)

```javascript
// server/src/config/env.js
import { cleanEnv, str, port, url } from 'envalid';

// Validate and export environment variables
export const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'], default: 'development' }),
  PORT: port({ default: 3001 }),

  // Weather API
  WEATHER_API_KEY: str({ desc: 'OpenWeatherMap API key' }),
  WEATHER_API_BASE_URL: url({ default: 'https://api.openweathermap.org/data/2.5' }),

  // CORS
  FRONTEND_URL_LOCAL: url({ default: 'http://localhost:3000' }),
  FRONTEND_URL_PRODUCTION: url({ devDefault: '' }),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: str({ default: '900000' }), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: str({ default: '100' }),

  // Caching
  CACHE_TTL_SECONDS: str({ default: '1800' }), // 30 minutes
});

// Export commonly used variables
export const {
  NODE_ENV,
  PORT,
  WEATHER_API_KEY,
  WEATHER_API_BASE_URL,
  FRONTEND_URL_LOCAL,
  FRONTEND_URL_PRODUCTION,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CACHE_TTL_SECONDS,
} = env;
```

### 3.4 CORS Configuration (config/cors.js)

```javascript
// server/src/config/cors.js
import { NODE_ENV, FRONTEND_URL_LOCAL, FRONTEND_URL_PRODUCTION } from './env.js';

/**
 * CORS configuration for development and production
 * Development: Allow localhost origins
 * Production: Allow only configured production origin
 */
export const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or Postman)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = NODE_ENV === 'production'
      ? [FRONTEND_URL_PRODUCTION]
      : [FRONTEND_URL_LOCAL, 'http://localhost:3000', 'https://localhost:3000'];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400, // 24 hours
};
```

### 3.5 Rate Limiting Configuration (config/rateLimits.js)

```javascript
// server/src/config/rateLimits.js
import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from './env.js';

/**
 * Rate limiter for weather API endpoints
 * Protects against excessive calls to external weather API
 */
export const weatherRateLimiter = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(RATE_LIMIT_MAX_REQUESTS, 10),
  message: {
    success: false,
    error: {
      message: 'Too many weather requests, please try again later.',
      retryAfter: '15 minutes'
    }
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000 / 60) + ' minutes'
      }
    });
  },
});

/**
 * Rate limiter for recommendation endpoints
 * More generous since these are internal computations
 */
export const recommendationsRateLimiter = rateLimit({
  windowMs: parseInt(RATE_LIMIT_WINDOW_MS, 10),
  max: parseInt(RATE_LIMIT_MAX_REQUESTS, 10) * 5, // 5x more generous
  message: {
    success: false,
    error: {
      message: 'Too many recommendation requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Strict rate limiter for health check endpoint
 * Prevents monitoring abuse
 */
export const healthRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});
```

### 3.6 Custom Error Classes (utils/CustomError.js)

```javascript
// server/src/utils/CustomError.js

/**
 * Base custom error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 */
export class BadRequestError extends AppError {
  constructor(message = 'Bad request') {
    super(message, 400);
  }
}

/**
 * 401 Unauthorized
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * 503 Service Unavailable (for external API failures)
 */
export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503);
  }
}
```

### 3.7 Async Error Handler Wrapper (utils/asyncHandler.js)

```javascript
// server/src/utils/asyncHandler.js

/**
 * Wrapper for async route handlers to catch errors automatically
 * Eliminates need for try/catch in every controller
 *
 * Express 5 will do this automatically, but Express 4 requires this wrapper
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### 3.8 Global Error Handler Middleware (middleware/errorHandler.js)

```javascript
// server/src/middleware/errorHandler.js
import { NODE_ENV } from '../config/env.js';
import { AppError } from '../utils/CustomError.js';

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized access';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  }

  // Log error (in production, send to logging service)
  console.error('❌ Error:', {
    message: err.message,
    statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.details || null,
      }),
    },
  };

  res.status(statusCode).json(errorResponse);
};
```

### 3.9 Request Validation Middleware (middleware/validateRequest.js)

```javascript
// server/src/middleware/validateRequest.js
import { validationResult } from 'express-validator';
import { BadRequestError } from '../utils/CustomError.js';

/**
 * Middleware to check validation results and format errors
 * Used after express-validator validation chains
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
    }));

    throw new BadRequestError('Validation failed', {
      errors: formattedErrors,
    });
  }

  next();
};
```

### 3.10 Weather Route Validators (validators/weather.validators.js)

```javascript
// server/src/validators/weather.validators.js
import { query, param } from 'express-validator';

/**
 * Validation for GET /api/weather/current
 * Query params: lat, lon, units (optional)
 */
export const validateCurrentWeather = [
  query('lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  query('lon')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  query('units')
    .optional()
    .isIn(['metric', 'imperial', 'standard']).withMessage('Units must be metric, imperial, or standard'),
];

/**
 * Validation for GET /api/weather/forecast
 * Query params: lat, lon, days (optional), units (optional)
 */
export const validateForecast = [
  query('lat')
    .notEmpty().withMessage('Latitude is required')
    .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  query('lon')
    .notEmpty().withMessage('Longitude is required')
    .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  query('days')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Days must be between 1 and 7'),

  query('units')
    .optional()
    .isIn(['metric', 'imperial', 'standard']).withMessage('Units must be metric, imperial, or standard'),
];
```

### 3.11 Weather Routes (routes/weather.routes.js)

```javascript
// server/src/routes/weather.routes.js
import { Router } from 'express';
import { getCurrentWeather, getForecast } from '../controllers/weather.controller.js';
import { weatherRateLimiter } from '../config/rateLimits.js';
import { validateCurrentWeather, validateForecast } from '../validators/weather.validators.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

// Apply rate limiting to all weather routes
router.use(weatherRateLimiter);

/**
 * GET /api/weather/current
 * Get current weather for given coordinates
 */
router.get(
  '/current',
  validateCurrentWeather,
  validateRequest,
  asyncHandler(getCurrentWeather)
);

/**
 * GET /api/weather/forecast
 * Get weather forecast for given coordinates
 */
router.get(
  '/forecast',
  validateForecast,
  validateRequest,
  asyncHandler(getForecast)
);

export default router;
```

### 3.12 Weather Controller (controllers/weather.controller.js)

```javascript
// server/src/controllers/weather.controller.js
import { fetchCurrentWeather, fetchForecast } from '../services/weatherAPI.service.js';

/**
 * @route   GET /api/weather/current
 * @desc    Get current weather for coordinates
 * @access  Public
 */
export const getCurrentWeather = async (req, res) => {
  const { lat, lon, units = 'imperial' } = req.query;

  const weatherData = await fetchCurrentWeather(lat, lon, units);

  res.json({
    success: true,
    data: weatherData,
  });
};

/**
 * @route   GET /api/weather/forecast
 * @desc    Get weather forecast for coordinates
 * @access  Public
 */
export const getForecast = async (req, res) => {
  const { lat, lon, days = 5, units = 'imperial' } = req.query;

  const forecastData = await fetchForecast(lat, lon, days, units);

  res.json({
    success: true,
    data: forecastData,
  });
};
```

### 3.13 Weather API Service (services/weatherAPI.service.js)

```javascript
// server/src/services/weatherAPI.service.js
import { WEATHER_API_KEY, WEATHER_API_BASE_URL } from '../config/env.js';
import { ServiceUnavailableError, NotFoundError } from '../utils/CustomError.js';
import { getCached, setCache } from './cache.service.js';

/**
 * Fetch current weather from OpenWeatherMap API
 * Implements caching to reduce external API calls
 */
export const fetchCurrentWeather = async (lat, lon, units = 'imperial') => {
  const cacheKey = `weather:current:${lat}:${lon}:${units}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  // Fetch from API
  const url = `${WEATHER_API_BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new NotFoundError('Location not found');
      }
      throw new ServiceUnavailableError('Weather service unavailable');
    }

    const data = await response.json();

    // Transform API response to our format
    const weatherData = {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: { lat: data.coord.lat, lon: data.coord.lon },
      },
      current: {
        temp: data.main.temp,
        feelsLike: data.main.feels_like,
        tempMin: data.main.temp_min,
        tempMax: data.main.temp_max,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
      },
      timestamp: new Date().toISOString(),
    };

    // Cache for 30 minutes
    setCache(cacheKey, weatherData, 1800);

    return weatherData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Weather API error:', error);
    throw new ServiceUnavailableError('Failed to fetch weather data');
  }
};

/**
 * Fetch weather forecast from OpenWeatherMap API
 */
export const fetchForecast = async (lat, lon, days = 5, units = 'imperial') => {
  const cacheKey = `weather:forecast:${lat}:${lon}:${days}:${units}`;

  // Check cache first
  const cached = getCached(cacheKey);
  if (cached) {
    console.log('✅ Cache hit:', cacheKey);
    return cached;
  }

  // Fetch from API
  const url = `${WEATHER_API_BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${units}&appid=${WEATHER_API_KEY}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new ServiceUnavailableError('Weather service unavailable');
    }

    const data = await response.json();

    // Transform and filter forecast data
    const forecastData = {
      location: {
        name: data.city.name,
        country: data.city.country,
        coordinates: { lat: data.city.coord.lat, lon: data.city.coord.lon },
      },
      forecast: data.list.slice(0, days * 8).map(item => ({
        datetime: item.dt_txt,
        temp: item.main.temp,
        feelsLike: item.main.feels_like,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
        precipitation: item.pop, // Probability of precipitation
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      })),
      timestamp: new Date().toISOString(),
    };

    // Cache for 1 hour
    setCache(cacheKey, forecastData, 3600);

    return forecastData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error('Forecast API error:', error);
    throw new ServiceUnavailableError('Failed to fetch forecast data');
  }
};
```

### 3.14 Simple In-Memory Cache Service (services/cache.service.js)

```javascript
// server/src/services/cache.service.js

/**
 * Simple in-memory cache
 * For production, consider Redis or Memcached for distributed caching
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Get cached value
   */
  get(key) {
    return this.cache.get(key);
  }

  /**
   * Set cached value with TTL (time to live in seconds)
   */
  set(key, value, ttlSeconds) {
    // Clear existing timer if present
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Set value
    this.cache.set(key, value);

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);

    this.timers.set(key, timer);
  }

  /**
   * Delete cached value
   */
  delete(key) {
    this.cache.delete(key);

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.timers.forEach(timer => clearTimeout(timer));
    this.cache.clear();
    this.timers.clear();
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size;
  }
}

// Singleton instance
const cacheService = new CacheService();

export const getCached = (key) => cacheService.get(key);
export const setCache = (key, value, ttl) => cacheService.set(key, value, ttl);
export const deleteCache = (key) => cacheService.delete(key);
export const clearCache = () => cacheService.clear();
export const getCacheSize = () => cacheService.size();
```

---

## 4. Security Considerations

### 4.1 API Key Storage

**Never commit API keys to version control:**

```bash
# .gitignore
.env
.env.local
.env.*.local
```

**Use .env.example as template:**

```bash
# .env.example (safe to commit)
NODE_ENV=development
PORT=3001

# Weather API
WEATHER_API_KEY=your_openweathermap_api_key_here
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5

# CORS
FRONTEND_URL_LOCAL=http://localhost:3000
FRONTEND_URL_PRODUCTION=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Caching
CACHE_TTL_SECONDS=1800
```

### 4.2 Request Validation

**Always validate and sanitize user input:**

```javascript
// Prevent injection attacks
import { body, query } from 'express-validator';

export const validateInput = [
  query('location').trim().escape(),
  body('preferences').isObject(),
];
```

### 4.3 Rate Limiting Strategy

**Multi-tier rate limiting:**

1. **Global rate limit:** Prevent overall server abuse
2. **Route-specific limits:** Protect expensive endpoints
3. **IP-based tracking:** Identify malicious actors
4. **Distributed rate limiting:** Use Redis for multi-instance deployments

### 4.4 CORS Security

**Production CORS must be restrictive:**

```javascript
// ❌ Bad: Allows any origin
cors({ origin: '*' })

// ✅ Good: Explicit allowlist
cors({
  origin: process.env.FRONTEND_URL_PRODUCTION,
  credentials: true
})
```

### 4.5 Error Response Security

**Never leak sensitive information in errors:**

```javascript
// ❌ Bad: Exposes internal details
res.status(500).json({ error: error.stack });

// ✅ Good: Generic message in production
res.status(500).json({
  success: false,
  error: { message: 'Internal server error' }
});
```

### 4.6 Additional Security Headers

**Use helmet.js for security headers:**

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openweathermap.org"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  }
}));
```

---

## 5. Testing Strategy

### 5.1 Testing Philosophy

**Test Pyramid:**
```
        /\
       /E2E\      <- Few (critical user flows)
      /------\
     /  API   \   <- More (endpoint integration tests)
    /----------\
   /   Unit     \ <- Most (business logic, utilities)
  /--------------\
```

### 5.2 Vitest Configuration (vitest.config.js)

```javascript
// server/vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/config/**',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
    setupFiles: ['./tests/setup.js'],
  },
});
```

### 5.3 Test Setup (tests/setup.js)

```javascript
// server/tests/setup.js
import { beforeAll, afterAll, afterEach } from 'vitest';
import { clearCache } from '../src/services/cache.service.js';

// Clear cache before all tests
beforeAll(() => {
  clearCache();
});

// Clear cache after each test to prevent test pollution
afterEach(() => {
  clearCache();
});

// Cleanup after all tests
afterAll(() => {
  clearCache();
});
```

### 5.4 Integration Test Example (tests/integration/weather.test.js)

```javascript
// server/tests/integration/weather.test.js
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';

describe('Weather API Endpoints', () => {
  const validLat = 40.7128;
  const validLon = -74.0060;

  describe('GET /api/weather/current', () => {
    it('should return current weather for valid coordinates', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: validLat, lon: validLon, units: 'imperial' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('location');
      expect(response.body.data).toHaveProperty('current');
      expect(response.body.data.current).toHaveProperty('temp');
      expect(response.body.data.current).toHaveProperty('humidity');
    });

    it('should return 400 for missing latitude', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lon: validLon })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.error).toHaveProperty('message');
    });

    it('should return 400 for invalid latitude range', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: 100, lon: validLon })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should return 400 for invalid units', async () => {
      const response = await request(app)
        .get('/api/weather/current')
        .query({ lat: validLat, lon: validLon, units: 'invalid' })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/weather/forecast', () => {
    it('should return forecast for valid coordinates', async () => {
      const response = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: validLat, lon: validLon, days: 5 })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('forecast');
      expect(Array.isArray(response.body.data.forecast)).toBe(true);
    });

    it('should use cached data on subsequent requests', async () => {
      // First request
      const response1 = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: validLat, lon: validLon })
        .expect(200);

      const timestamp1 = response1.body.data.timestamp;

      // Second request (should be cached)
      const response2 = await request(app)
        .get('/api/weather/forecast')
        .query({ lat: validLat, lon: validLon })
        .expect(200);

      const timestamp2 = response2.body.data.timestamp;

      // Timestamps should match if cached
      expect(timestamp1).toBe(timestamp2);
    });
  });
});
```

### 5.5 Unit Test Example (tests/unit/services/cache.test.js)

```javascript
// server/tests/unit/services/cache.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCached, setCache, deleteCache, clearCache, getCacheSize } from '../../../src/services/cache.service.js';

describe('Cache Service', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should set and get cache values', () => {
    setCache('key1', { data: 'value1' }, 60);
    const value = getCached('key1');
    expect(value).toEqual({ data: 'value1' });
  });

  it('should return undefined for non-existent keys', () => {
    const value = getCached('nonexistent');
    expect(value).toBeUndefined();
  });

  it('should delete cached values', () => {
    setCache('key1', 'value1', 60);
    deleteCache('key1');
    const value = getCached('key1');
    expect(value).toBeUndefined();
  });

  it('should expire cached values after TTL', async () => {
    vi.useFakeTimers();

    setCache('key1', 'value1', 2); // 2 second TTL

    // Value should exist immediately
    expect(getCached('key1')).toBe('value1');

    // Fast-forward time by 3 seconds
    vi.advanceTimersByTime(3000);

    // Value should be expired
    expect(getCached('key1')).toBeUndefined();

    vi.useRealTimers();
  });

  it('should clear all cached values', () => {
    setCache('key1', 'value1', 60);
    setCache('key2', 'value2', 60);

    expect(getCacheSize()).toBe(2);

    clearCache();

    expect(getCacheSize()).toBe(0);
  });

  it('should update existing key with new value and TTL', () => {
    setCache('key1', 'value1', 60);
    setCache('key1', 'value2', 60);

    const value = getCached('key1');
    expect(value).toBe('value2');
    expect(getCacheSize()).toBe(1);
  });
});
```

### 5.6 Running Tests

```json
// package.json scripts
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:integration": "vitest run tests/integration",
  "test:unit": "vitest run tests/unit"
}
```

**Commands:**

```bash
# Run all tests once
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run only integration tests
npm run test:integration

# Run only unit tests
npm run test:unit
```

### 5.7 Testing Best Practices

1. **Isolate tests:** Each test should be independent and not rely on others
2. **Use beforeEach/afterEach:** Clean up state between tests
3. **Mock external APIs:** Use vi.fn() to mock fetch calls in unit tests
4. **Test error paths:** Don't just test happy paths
5. **Aim for 80%+ coverage:** But focus on critical paths first
6. **Name tests clearly:** Use descriptive test names that explain what's being tested
7. **Group related tests:** Use describe blocks to organize tests logically

---

## 6. Development Workflow

### 6.1 Project Initialization

```bash
# Create server directory
mkdir server
cd server

# Initialize package.json
npm init -y

# Install dependencies
npm install express cors helmet dotenv express-validator express-rate-limit

# Install dev dependencies
npm install -D vitest supertest @vitest/coverage-v8

# Create directory structure
mkdir -p src/{config,routes,controllers,services,middleware,validators,utils}
mkdir -p tests/{integration,unit}

# Create .env file
cp .env.example .env
```

### 6.2 Environment Variables Setup

```bash
# .env (never commit)
NODE_ENV=development
PORT=3001

WEATHER_API_KEY=your_actual_api_key_here
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5

FRONTEND_URL_LOCAL=http://localhost:3000
FRONTEND_URL_PRODUCTION=

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CACHE_TTL_SECONDS=1800
```

### 6.3 Package.json Scripts

```json
{
  "name": "weatherman-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch --env-file=.env src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src"
  }
}
```

### 6.4 Running the Server

```bash
# Development mode with hot reload
npm run dev

# Production mode
NODE_ENV=production npm start

# Run tests
npm test

# Watch mode for TDD
npm run test:watch
```

---

## 7. Deployment Considerations

### 7.1 Production Checklist

- [ ] Use environment variables from hosting platform (not .env)
- [ ] Enable HTTPS (required for geolocation and PWA)
- [ ] Configure production CORS origins
- [ ] Set NODE_ENV=production
- [ ] Enable compression middleware (gzip)
- [ ] Implement proper logging (Winston, Pino)
- [ ] Set up monitoring (Sentry, New Relic)
- [ ] Use Redis for distributed rate limiting and caching
- [ ] Configure CDN for static assets
- [ ] Set up health check endpoint monitoring

### 7.2 Recommended Hosting Platforms

**Option 1: Vercel**
- Zero-config deployment
- Automatic HTTPS
- Edge network
- Environment variable management

**Option 2: Railway**
- Simple deployment from GitHub
- Built-in database support
- Easy environment variables
- Free tier available

**Option 3: Render**
- Free tier with custom domains
- Auto-deploy from GitHub
- Environment variable management
- Built-in Redis support

### 7.3 Production Environment Variables

```bash
# Set on hosting platform (not in .env)
NODE_ENV=production
PORT=3001

WEATHER_API_KEY=<your_production_api_key>
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5

FRONTEND_URL_PRODUCTION=https://weatherman.yourdomain.com

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

CACHE_TTL_SECONDS=1800

# Optional: Redis for distributed caching
REDIS_URL=redis://username:password@host:port
```

---

## 8. Future Enhancements

### 8.1 Redis Integration (for production scale)

```javascript
// services/cache.service.js with Redis
import Redis from 'ioredis';
import { REDIS_URL } from '../config/env.js';

const redis = new Redis(REDIS_URL);

export const getCached = async (key) => {
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
};

export const setCache = async (key, value, ttl) => {
  await redis.setex(key, ttl, JSON.stringify(value));
};
```

### 8.2 Advanced Rate Limiting (Redis-backed)

```javascript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL);

export const weatherRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:weather:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});
```

### 8.3 Logging (Winston)

```javascript
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}
```

### 8.4 API Documentation (Swagger)

```javascript
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Weatherman API',
      version: '1.0.0',
      description: 'Weather and clothing recommendation API',
    },
    servers: [
      { url: 'http://localhost:3001/api', description: 'Development' },
      { url: 'https://api.weatherman.com/api', description: 'Production' },
    ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
```

---

## 9. Summary of Key Decisions

| Decision | Chosen Approach | Rationale |
|----------|----------------|-----------|
| **Architecture** | Three-layer (Routes/Services/Data) | Separation of concerns, testability |
| **Validation** | express-validator | Reliability, comprehensive features, industry standard |
| **Rate Limiting** | express-rate-limit | Proven solution, flexible, 10M+ downloads |
| **Testing** | Vitest + Supertest | Modern, fast, consistent with frontend tooling |
| **Env Management** | dotenv (dev), native (prod) | Simple for dev, secure for production |
| **Error Handling** | Custom error classes + global middleware | Centralized, consistent error responses |
| **Caching** | In-memory (start), Redis (scale) | Simple to start, easy to upgrade |
| **CORS** | Environment-based allowlist | Secure, flexible for dev/prod |
| **Security** | Helmet + validation + rate limiting | Defense in depth |

---

## 10. Sources

This document was researched using the following authoritative sources:

### Express.js Architecture
- [Best Practices for Structuring an Express.js Project - DEV Community](https://dev.to/moibra/best-practices-for-structuring-an-expressjs-project-148i)
- [How to structure an Express.js REST API with best practices - Treblle](https://treblle.com/blog/egergr)
- [Organizing your Express.js project structure for better productivity - LogRocket Blog](https://blog.logrocket.com/organizing-express-js-project-structure-better-productivity/)
- [Express.js Folder Structure Best Practices For Fast Teams](https://www.dhiwise.com/post/express-js-folder-structure-best-practices-for-clean-code)

### Error Handling
- [Express Error Handling Patterns | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/error-handling-express/)
- [Express error handling (Official Docs)](https://expressjs.com/en/guide/error-handling.html)
- [Express for Node Error Handling and Tracking Done Right | AppSignal Blog](https://blog.appsignal.com/2025/07/16/express-for-node-error-handling-and-tracking-done-right.html)

### Validation
- [Using Express-Validator for Data Validation in Node.js | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/express-validator-nodejs/)
- [Express Validator Tutorial - Auth0](https://auth0.com/blog/express-validator-tutorial/)
- [A Clean Approach to Using Express Validator - DEV Community](https://dev.to/nedsoft/a-clean-approach-to-using-express-validator-8go)

### Rate Limiting
- [Rate Limiting in Express.js | Better Stack Community](https://betterstack.com/community/guides/scaling-nodejs/rate-limiting-express/)
- [express-rate-limit - npm](https://www.npmjs.com/package/express-rate-limit)
- [GitHub - elvis-ndubuisi/quickproxi: Backend API proxy server with hidden API key, rate limiting and caching](https://github.com/elvis-ndubuisi/quickproxi)

### CORS Configuration
- [Express cors middleware (Official Docs)](https://expressjs.com/en/resources/middleware/cors.html)
- [How Would You Manage CORS in a Production Express.js Application? | Medium](https://article.arunangshudas.com/how-would-you-manage-cors-in-a-production-express-js-application-45a1138dd6df)
- [Node.js CORS Guide: What It Is and How to Enable It](https://www.stackhawk.com/blog/nodejs-cors-guide-what-it-is-and-how-to-enable-it/)

### Testing
- [A Simple Guide to Setting Up HTTP-Level Tests with Vitest, MongoDB and Supertest | Medium](https://medium.com/@burzhuas/a-simple-guide-to-setting-up-http-level-tests-with-vitest-mongodb-and-supertest-1c5c90d22321)
- [How to Test Your Node.js RESTful API with Vitest: Unit & Integration Testing](https://danioshi.substack.com/p/how-to-test-your-nodejs-restful-api)
- [Testing an Express.js API with Vitest](https://erickmedel.dev/blog/vitest-express)

### Environment Variables & Security
- [Enhancing Security in Express.js Applications with Environment Variables Best Practices | MoldStud](https://moldstud.com/articles/p-secure-your-expressjs-apps-with-environment-variables)
- [Should You Still Use dotenv in 2025?](https://infisical.com/blog/stop-using-dotenv-in-nodejs-v20.6.0+)
- [How to Secure Environment Variables and API Keys in Node.js Applications](https://www.ionicframeworks.com/2025/09/how-to-secure-environment-variables-and.html)

---

## Appendix: Quick Start Command Reference

```bash
# Setup
mkdir server && cd server
npm init -y
npm install express cors helmet dotenv express-validator express-rate-limit
npm install -D vitest supertest @vitest/coverage-v8

# Development
npm run dev

# Testing
npm test
npm run test:watch
npm run test:coverage

# Production
NODE_ENV=production npm start
```

---

**Document Status:** Complete
**Next Steps:** Implement server structure based on this architecture
