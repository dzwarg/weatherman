# @weatherman/server

Express.js API server for the Weatherman application, providing weather data proxying and clothing recommendations.

## Overview

The server component handles:
- **Weather Proxying**: Securely proxies OpenWeatherMap API requests with server-side credential management
- **Rate Limiting**: Centralized rate limiting for external API calls
- **Recommendations Service**: Rule-based clothing recommendations (with Ollama integration architecture for future enhancement)
- **Error Handling**: Standardized error responses and logging

## Quick Start

```bash
# From server directory
cd packages/server

# Install dependencies (or use root-level npm install)
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your WEATHER_API_KEY

# Start development server
npm run dev
```

Server starts at `http://localhost:3000`

## Environment Variables

Create a `.env` file in `packages/server/`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Weather API
WEATHER_API_KEY=your_openweathermap_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Optional: Ollama Integration (future)
# OLLAMA_API_URL=http://localhost:11434
```

## API Endpoints

### Health Check

```bash
GET /api/health
```

Returns server and service status.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "services": {
    "weatherApi": "connected",
    "ollama": "unavailable"
  }
}
```

### Weather Endpoints

#### Get Current Weather

```bash
POST /api/weather/current
Content-Type: application/json

{
  "lat": 42.3601,
  "lon": -71.0589,
  "units": "imperial"
}
```

**Rate Limit:** 100 requests per 15 minutes

**Response:** OpenWeatherMap current weather data

#### Get Weather Forecast

```bash
POST /api/weather/forecast
Content-Type: application/json

{
  "lat": 42.3601,
  "lon": -71.0589,
  "units": "imperial"
}
```

**Rate Limit:** 100 requests per 15 minutes

**Response:** OpenWeatherMap forecast data

### Recommendation Endpoints

#### Get Clothing Recommendations

```bash
POST /api/recommendations
Content-Type: application/json

{
  "profile": {
    "id": "7yo-boy",
    "age": 7,
    "gender": "boy"
  },
  "weather": {
    "temperature": 45,
    "feelsLike": 42,
    "humidity": 65,
    "windSpeed": 10,
    "uvIndex": 3,
    "conditions": "cloudy",
    "precipitation": 0
  },
  "voicePrompt": "What should I wear to school today?"
}
```

**Rate Limit:** 500 requests per 15 minutes

**Response:**
```json
{
  "recommendations": {
    "baseLayers": [
      { "item": "Long-sleeve shirt", "reason": "It's cool outside" }
    ],
    "outerwear": [
      { "item": "Light jacket", "reason": "To stay warm" }
    ],
    "bottoms": [
      { "item": "Long pants", "reason": "Your legs will be comfortable" }
    ],
    "accessories": [],
    "footwear": [
      { "item": "Sneakers", "reason": "Good for running around" }
    ]
  },
  "spokenResponse": "Here's what I think you should wear today! ...",
  "confidence": 0.85
}
```

#### Get Available Profiles

```bash
GET /api/recommendations/profiles
```

**Response:**
```json
{
  "profiles": [
    { "id": "4yo-girl", "age": 4, "gender": "girl" },
    { "id": "7yo-boy", "age": 7, "gender": "boy" },
    { "id": "10yo-boy", "age": 10, "gender": "boy" }
  ]
}
```

## Project Structure

```
packages/server/
├── src/
│   ├── config/
│   │   ├── env.js                 # Environment variable loading & validation
│   │   └── constants.js           # Application constants
│   ├── controllers/
│   │   ├── weatherController.js   # Weather endpoint handlers
│   │   └── recommendationsController.js  # Recommendation handlers
│   ├── middleware/
│   │   ├── errorHandler.js        # Global error handling
│   │   ├── requestLogger.js       # Request logging
│   │   ├── cors.js                # CORS configuration
│   │   └── rateLimiter.js         # Rate limiting
│   ├── routes/
│   │   ├── weather.js             # Weather route definitions
│   │   └── recommendations.js     # Recommendation routes
│   ├── services/
│   │   ├── weatherProxyService.js # Weather API client
│   │   └── recommendationService.js  # Recommendation orchestration
│   ├── utils/
│   │   └── clothingRules.js       # Rule-based recommendations
│   ├── validators/
│   │   ├── weatherValidator.js    # Weather request validation
│   │   └── recommendationValidator.js  # Recommendation validation
│   └── server.js                  # Express app entry point
├── tests/
│   ├── unit/                      # Unit tests
│   │   ├── validators/
│   │   ├── services/
│   │   ├── middleware/
│   │   └── utils/
│   ├── integration/               # Integration tests
│   │   ├── weather.test.js
│   │   └── recommendations.test.js
│   └── helpers/                   # Test utilities
├── .env.example                   # Example environment variables
├── package.json                   # Dependencies and scripts
├── vitest.config.js               # Test configuration
└── README.md                      # This file
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run with coverage
npm run test:coverage
```

### Test Coverage

Current test coverage targets:
- Lines: 80%+
- Functions: 80%+
- Branches: 80%+
- Statements: 80%+

## Architecture

### Request Flow

1. **Client Request** → Frontend makes API call to `/api/*`
2. **Vite Proxy** → Dev server proxies to `http://localhost:3000`
3. **Express Middleware** → Request passes through:
   - Helmet (security headers)
   - CORS
   - Body parser
   - Request logger
   - Rate limiter (endpoint-specific)
4. **Controller** → Validates request, calls service
5. **Service** → Business logic (API calls, data processing)
6. **Response** → JSON response or error

### Error Handling

All errors are handled by the global error handler middleware, which returns standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  },
  "timestamp": "2025-12-19T10:00:00.000Z"
}
```

Common error codes:
- `INVALID_REQUEST` (400): Validation errors
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `WEATHER_API_ERROR` (503): Weather API unavailable
- `WEATHER_API_TIMEOUT` (503): Weather API timeout

### Rate Limiting

Rate limits are configured per endpoint:
- Weather endpoints: 100 requests per 15 minutes
- Recommendation endpoints: 500 requests per 15 minutes

## Development

### Adding New Endpoints

1. Create validator in `src/validators/`
2. Create service in `src/services/`
3. Create controller in `src/controllers/`
4. Create route in `src/routes/`
5. Integrate route in `src/server.js`
6. Write unit tests for validator and service
7. Write integration tests for endpoint

### Testing Approach

This project follows Test-Driven Development (TDD):
1. Write tests FIRST
2. Verify tests FAIL
3. Implement code to make tests pass
4. Refactor as needed

## Security

- API keys stored server-side only (never exposed to client)
- CORS configured for specific origins
- Helmet middleware for security headers
- Rate limiting to prevent abuse
- Input validation on all endpoints
- Error messages don't expose implementation details

## Future Enhancements

- Ollama integration for AI-powered recommendations
- Caching layer (Redis) for weather data
- Authentication/authorization for protected endpoints
- Logging aggregation (Winston, CloudWatch)
- Health metrics and monitoring
- Production deployment configuration

## Related Documentation

- [Root README](../../README.md) - Monorepo overview
- [Frontend README](../frontend/README.md) - Frontend documentation
- [API Integration Guide](../../docs/api-integration.md) - API usage examples (if available)

## Contributing

When contributing to the server:
1. Follow TDD approach (tests first)
2. Maintain 80%+ test coverage
3. Use ESM syntax (import/export)
4. Document all new endpoints in this README
5. Update .env.example for new environment variables
