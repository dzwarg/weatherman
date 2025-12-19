# Research: Monorepo Architecture with Server Component

**Feature**: 002-monorepo-server \
**Created**: 2025-12-19 \
**Research Phase**: Phase 0 - Technology Decisions

## Overview

This document consolidates research findings for converting the Weatherman single-app PWA into a monorepo structure with npm workspaces, adding an Express.js server component for weather API proxying and dynamic clothing recommendations.

---

## 1. Monorepo Structure with npm Workspaces

### Decision

Use **npm workspaces** (native npm 7+ feature) with the following structure:

```
weatherman/
├── package.json                 # Root workspace configuration
├── packages/
│   ├── frontend/               # React + Vite PWA (@weatherman/frontend)
│   └── server/                 # Express API (@weatherman/server)
└── node_modules/               # Shared dependencies hoisted to root
```

### Rationale

**Why npm workspaces:**
1. **Native npm support**: Built into npm 7+, no additional tools required
2. **Dependency hoisting**: Shared dependencies (React, testing libraries) installed once at root
3. **Independent builds**: Frontend and server maintain separate configurations
4. **Simplified development**: Run both packages simultaneously with concurrently
5. **Progressive enhancement**: Can add shared packages later (e.g., @weatherman/shared)
6. **Industry standard**: Used by major projects; simpler than Lerna/Turborepo for 2-package repos

**Why NOT alternatives:**
- **Lerna**: Deprecated in favor of native npm workspaces
- **Turborepo/Nx**: Overkill for 2 packages; adds unnecessary complexity
- **pnpm**: Excellent but adds tooling change; npm workspaces are sufficient

### Configuration

**Root package.json:**
```json
{
  "name": "weatherman",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:server\"",
    "dev:frontend": "npm run dev --workspace=@weatherman/frontend",
    "dev:server": "npm run dev --workspace=@weatherman/server",
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "devDependencies": {
    "concurrently": "^9.0.0"
  },
  "engines": {
    "node": ">=22.0.0",
    "npm": ">=7.0.0"
  }
}
```

**Package naming conventions:**
- Use `@weatherman/` scope for all packages
- Prevents naming conflicts with public npm packages
- Groups packages under one namespace in node_modules
- Professional convention (e.g., `@babel/`, `@typescript-eslint/`)

### Migration Strategy

**Safe migration steps:**
1. Create backup branch
2. Create `packages/frontend/` and `packages/server/` directories
3. Move existing code to `packages/frontend/` using `git mv` (preserves history)
4. Create package.json for each workspace
5. Update root package.json with workspace configuration
6. Clean installation: remove all node_modules and package-lock.json
7. Run `npm install` to set up workspaces
8. Test both packages independently and together

**Critical considerations:**
- Use `git mv` not regular `mv` to preserve file history
- Vite needs proxy configuration to avoid CORS issues
- Service Worker paths remain relative to frontend package
- Environment variables need workspace-aware configuration

### Common Pitfalls & Solutions

**Issue**: Vite HMR doesn't work after moving to workspaces
**Solution**: Update Vite config:
```javascript
server: {
  fs: {
    allow: ['..', '../../node_modules']
  }
}
```

**Issue**: Module resolution errors after workspace setup
**Solution**: Verify symlinks exist: `ls -la node_modules/@weatherman/`
Re-run `npm install` if missing

**Issue**: Tests fail due to changed paths
**Solution**: Update test setup files with correct root paths

---

## 2. Express Server Architecture

### Decision

Use **three-layer architecture** with Express.js:

```
packages/server/
├── src/
│   ├── server.js               # Express app initialization
│   ├── config/                 # Environment, CORS, constants
│   │   ├── env.js
│   │   ├── cors.js
│   │   └── rateLimits.js
│   ├── routes/                 # Route definitions
│   │   ├── weather.js
│   │   └── recommendations.js
│   ├── controllers/            # Request/response handling (thin)
│   │   ├── weatherController.js
│   │   └── recommendationsController.js
│   ├── services/               # Business logic (no Express deps)
│   │   ├── weatherProxyService.js
│   │   └── recommendationService.js
│   ├── middleware/             # Express middleware
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── requestLogger.js
│   ├── validators/             # Request validation schemas
│   │   ├── weatherValidator.js
│   │   └── recommendationValidator.js
│   └── utils/                  # Utilities
│       ├── asyncHandler.js
│       └── errors.js
└── tests/
    ├── integration/            # API endpoint tests
    └── unit/                   # Service tests
```

### Rationale

**Why three-layer architecture:**
1. **Separation of concerns**: Routes → Controllers → Services
2. **Testability**: Services have no Express dependencies, easy to unit test
3. **Maintainability**: Business logic isolated from HTTP concerns
4. **Scalability**: Easy to add new endpoints or swap out Express later

**Layer responsibilities:**
- **Routes**: Define HTTP endpoints and HTTP methods
- **Controllers**: Handle req/res, call services, format responses
- **Services**: Pure business logic, no req/res objects

### Technology Decisions

**Framework: Express.js 4.x**
- Industry standard, mature, well-documented
- Middleware ecosystem for every need
- Lightweight and flexible
- Express 5 in beta but not stable yet

**Environment variables: dotenv**
- Simple, familiar developer experience
- `.env` file for development
- Environment variables in production
- Never commit `.env` files

**Request validation: express-validator**
- Built on validator.js (robust, 10M+ downloads/week)
- Chainable API reduces boilerplate
- Includes sanitization for XSS prevention
- Industry standard for Express apps

**Rate limiting: express-rate-limit**
- Simple in-memory rate limiting for small-scale apps
- Different limits per endpoint:
  - Weather API: 100 req/15min (protect external API quota)
  - Recommendations: 500 req/15min (internal computation)
  - Health checks: 10 req/min
- Can upgrade to Redis store for distributed systems later

**Error handling: Custom error classes + global middleware**
- Custom error classes (BadRequestError, NotFoundError, etc.)
- AsyncHandler wrapper for route handlers (Express 4 compatibility)
- Global error middleware catches all errors
- Centralized error handling, no try/catch in every route

**CORS: Environment-based origin validation**
- Development: Allow localhost on various ports
- Production: Strict allowlist with only production domain
- Never use wildcard (`*`) in production
- Configure with `cors` package

### Security Considerations

**API key storage:**
- Store in server environment variables only
- Never expose in client code or responses
- Validate on server startup

**Request validation:**
- Validate all numeric ranges (lat/lon, temperature, etc.)
- Sanitize string inputs to prevent XSS
- Use allowlist approach for enum values (profile IDs)

**Rate limiting:**
- Prevents external API quota overages
- Protects against abuse
- Different limits per endpoint based on cost

**Error responses:**
- Never leak sensitive information (API keys, stack traces)
- Generic error messages to clients
- Detailed logging server-side only

### Testing Strategy

**Framework: Vitest + Supertest**
- Vitest: 1.5x faster than Jest, consistent with frontend
- Supertest: HTTP-specific assertions, app bootstrapping
- Integration tests: Test full request/response cycle
- Unit tests: Test services in isolation

**Test pyramid:**
- Most tests: Unit tests (services, utilities)
- More tests: Integration tests (API endpoints)
- Few tests: E2E tests (full workflow)

**Coverage target: 80%+**

**Example integration test:**
```javascript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/weather/current', () => {
  it('should return weather data for valid coordinates', async () => {
    const response = await request(app)
      .post('/api/weather/current')
      .send({ lat: 42.3601, lon: -71.0589 })
      .expect(200);

    expect(response.body).toHaveProperty('location');
    expect(response.body).toHaveProperty('current');
    expect(response.body.current).toHaveProperty('temperature');
  });

  it('should return 400 for invalid latitude', async () => {
    const response = await request(app)
      .post('/api/weather/current')
      .send({ lat: 100, lon: -71.0589 })
      .expect(400);

    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });
});
```

---

## 3. Frontend-Server Integration

### Decision

**Development**: Use Vite proxy to forward `/api/*` requests to Express backend
**Production**: Use environment variables to configure API base URLs

### Rationale

**Why Vite proxy for development:**
1. **No CORS issues**: Browser sees same-origin requests
2. **Simple code**: Use relative paths (`/api/weather` not `http://localhost:3000/api/weather`)
3. **Zero configuration on Express**: No CORS middleware needed in dev
4. **Clean separation**: Proxy only runs in dev; production uses real URLs

**Why environment variables for production:**
1. **Flexibility**: Different API URLs per environment (dev/staging/prod)
2. **No hardcoded URLs**: Configuration, not code
3. **Vite native support**: `VITE_*` prefix with `import.meta.env`
4. **Security**: Production URLs not committed to repo

### Configuration

**Vite proxy setup (`packages/frontend/vite.config.js`):**
```javascript
export default defineConfig({
  server: {
    https: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

**Environment variables:**

`.env.development`:
```bash
VITE_API_BASE_URL=/api
```

`.env.production`:
```bash
VITE_API_BASE_URL=https://api.weatherman.app/api
```

**API client (`src/services/apiClient.js`):**
```javascript
class ApiClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  async get(endpoint) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }

  async post(endpoint, data) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}

export default new ApiClient();
```

### Service Worker Caching Strategy

**Decision: Network-First with Cache Fallback**

Extend existing Workbox configuration to cache server API responses:

```javascript
// packages/frontend/vite.config.js
workbox: {
  runtimeCaching: [
    // Existing OpenWeatherMap cache...

    // NEW: Express API endpoints
    {
      urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
      handler: 'NetworkFirst',
      options: {
        cacheName: 'server-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 5
      }
    }
  ]
}
```

**How it works:**
1. Try network first (always attempt fresh data)
2. If network fails or times out → serve from cache
3. Cache successful responses for 1 hour
4. 5-second timeout before falling back to cache

**Why Network-First:**
- Weather data changes frequently, needs freshness
- Recommendations should reflect latest logic
- Offline support still maintained (cache fallback)
- Aligns with PWA best practices for dynamic content

### Offline/Server Unavailable Handling

**Health check service:**
```javascript
// src/services/apiHealthCheck.js
class ApiHealthCheck {
  constructor() {
    this.status = {
      isOnline: navigator.onLine,
      apiAvailable: true,
      lastCheck: null
    };

    this.listeners = new Set();

    window.addEventListener('online', () => this.checkHealth());
    window.addEventListener('offline', () => this.setOffline());
  }

  async checkHealth() {
    try {
      await apiClient.get('/health');
      this.status.apiAvailable = true;
    } catch (error) {
      this.status.apiAvailable = false;
    }

    this.status.isOnline = navigator.onLine;
    this.status.lastCheck = new Date();
    this.notifyListeners();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.status));
  }
}

export default new ApiHealthCheck();
```

**React hook:**
```javascript
// src/hooks/useApiStatus.js
export function useApiStatus() {
  const [status, setStatus] = useState(apiHealthCheck.status);

  useEffect(() => {
    return apiHealthCheck.subscribe(setStatus);
  }, []);

  return status;
}
```

**UI indicator:**
```javascript
export function OfflineIndicator() {
  const { isOnline, apiAvailable } = useApiStatus();

  if (!isOnline) {
    return <Banner type="warning">📡 No internet - Using cached data</Banner>;
  }

  if (!apiAvailable) {
    return <Banner type="warning">⚠️ Server unavailable - Using cached data</Banner>;
  }

  return null;
}
```

### Development Workflow

**Install concurrently:**
```bash
npm install -D concurrently
```

**Root package.json scripts:**
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:server\" --names \"React,Express\" --prefix-colors \"cyan,green\"",
    "dev:frontend": "npm run dev --workspace=@weatherman/frontend",
    "dev:server": "npm run dev --workspace=@weatherman/server"
  }
}
```

**Run both servers:**
```bash
npm run dev
```

Frontend runs on https://localhost:5173 (HTTPS for PWA features)
Backend runs on http://localhost:3000 (HTTP, proxied by Vite)

### Production Deployment

**Option 1: Separate Deployments (Recommended)**

Frontend (static build):
- Build: `npm run build --workspace=@weatherman/frontend`
- Deploy `packages/frontend/dist/` to Vercel/Netlify/Cloudflare Pages
- Set `VITE_API_BASE_URL=https://api.weatherman.app/api`

Backend (Express server):
- Deploy `packages/server/` to Render/Railway/Fly.io
- Set `NODE_ENV=production`
- Configure CORS to allow frontend domain

**Option 2: Monorepo (Single Server)**

Express serves both API and static React build:
```javascript
// Production: Serve React static files
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
    }
  });
}
```

---

## 4. Ollama Integration for Clothing Recommendations

### Decision

Use **locally hosted Ollama service** for LLM-powered clothing recommendations with **frontend-mocked responses** for the three user profiles during initial development.

### Rationale

**Why Ollama:**
1. **Local hosting**: No external API costs, no rate limits, privacy-preserving
2. **Fast inference**: Local GPU/CPU execution, sub-second response times
3. **Model flexibility**: Can swap models (llama2, mistral, phi, etc.) without code changes
4. **Simple API**: REST API compatible with OpenAI format
5. **Development workflow**: Easy to start/stop, no cloud accounts needed

**Why frontend mocks initially:**
1. **Rapid development**: Don't block on Ollama setup for early testing
2. **Predictable responses**: Discrete responses per profile enable deterministic testing
3. **Progressive enhancement**: Start with mocks, replace with real Ollama calls iteratively
4. **Reduced dependencies**: Frontend can develop independently while Ollama service is configured

### Ollama API Format

**Endpoint**: `POST http://localhost:11434/api/generate`

**Request Format:**
```json
{
  "model": "mistral:latest",
  "prompt": "Given the following weather and user profile, suggest appropriate clothing:\n\nProfile: 4-year-old girl\nTemperature: 35°F (feels like 28°F)\nConditions: Rain\nWind: 12 mph\nActivity context: playground\n\nProvide age-appropriate clothing recommendations with reasons.",
  "stream": false,
  "options": {
    "temperature": 0.7,
    "top_p": 0.9,
    "max_tokens": 500
  }
}
```

**Response Format:**
```json
{
  "model": "mistral:latest",
  "created_at": "2025-12-19T10:30:00.000Z",
  "response": "For a 4-year-old girl going to the playground in cold, rainy weather:\n\n**Base Layers:**\n- Long-sleeve t-shirt: To stay warm\n\n**Outerwear:**\n- Warm winter coat: It's cold and rainy\n- Raincoat or poncho: To stay dry\n\n**Bottoms:**\n- Pull-on pants or leggings: Easy to put on and warm\n\n**Accessories:**\n- Warm hat: To keep your head warm\n- Gloves or mittens: To keep your hands warm\n- Umbrella: To stay dry in the rain\n\n**Footwear:**\n- Rain boots: To keep your feet dry",
  "done": true,
  "context": [...],
  "total_duration": 1234567890,
  "load_duration": 123456,
  "prompt_eval_count": 45,
  "prompt_eval_duration": 12345678,
  "eval_count": 120,
  "eval_duration": 987654321
}
```

### Frontend Mock Strategy

**Implementation approach:**

1. **Create mock responses for three profiles:**
   - `4yo-girl-cold-rainy.json`: Pre-generated Ollama response for 4yo girl in cold/rainy weather
   - `7yo-boy-moderate.json`: Pre-generated response for 7yo boy in moderate conditions
   - `10yo-boy-hot-sunny.json`: Pre-generated response for 10yo boy in hot/sunny weather

2. **Frontend service layer detects environment:**
```javascript
// packages/frontend/src/services/recommendationService.js
const USE_MOCK_OLLAMA = import.meta.env.VITE_USE_MOCK_OLLAMA === 'true';

async function getRecommendations(profile, weather, prompt) {
  if (USE_MOCK_OLLAMA) {
    return getMockOllamaResponse(profile, weather);
  }

  // Real server call
  return fetchRecommendationsFromServer(profile, weather, prompt);
}
```

3. **Mock selection logic:**
```javascript
function getMockOllamaResponse(profile, weather) {
  // Simple heuristic: select mock based on profile ID and temperature
  const key = `${profile.id}-${categorizeWeather(weather)}`;

  const mockResponses = {
    '4yo-girl-cold': coldRainyMock,
    '7yo-boy-moderate': moderateMock,
    '10yo-boy-hot': hotSunnyMock,
  };

  return mockResponses[key] || moderateMock; // Fallback to moderate
}
```

4. **Development workflow:**
   - Set `VITE_USE_MOCK_OLLAMA=true` in `.env.development` for rapid frontend iteration
   - Set `VITE_USE_MOCK_OLLAMA=false` when Ollama service is running for integration testing
   - Production always uses real server/Ollama integration

### Server Integration with Ollama

**Server service structure:**

```javascript
// packages/server/src/services/ollamaService.js
import axios from 'axios';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'mistral:latest';
const OLLAMA_TIMEOUT = 10000; // 10 second timeout

export async function generateRecommendations(profile, weather, promptContext) {
  const systemPrompt = buildPromptForOllama(profile, weather, promptContext);

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: systemPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.9,
          max_tokens: 500
        }
      },
      { timeout: OLLAMA_TIMEOUT }
    );

    return parseOllamaResponse(response.data.response, profile, weather);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('OLLAMA_SERVICE_UNAVAILABLE: Ollama service is not running');
    }
    throw error;
  }
}

function buildPromptForOllama(profile, weather, promptContext) {
  return `You are a helpful clothing advisor for children. Provide age-appropriate clothing recommendations.

Profile: ${profile.age}-year-old ${profile.gender}
Temperature: ${weather.temperature}°F (feels like ${weather.feelsLike}°F)
Conditions: ${weather.conditions}
Precipitation: ${weather.precipitationProbability}%
Wind: ${weather.windSpeed} mph
${promptContext ? `Activity context: ${promptContext}` : ''}

Provide structured recommendations with categories:
- Base Layers
- Outerwear
- Bottoms
- Accessories
- Footwear

For each item, include a child-friendly reason (1 sentence).`;
}
```

### Ollama Setup Instructions

**Local development setup:**

1. **Install Ollama:**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com/download
```

2. **Pull recommended model:**
```bash
ollama pull mistral:latest
# Alternative: ollama pull llama2:latest (smaller, faster)
```

3. **Start Ollama service:**
```bash
ollama serve
# Runs on http://localhost:11434 by default
```

4. **Verify Ollama is running:**
```bash
curl http://localhost:11434/api/tags
# Should return list of available models
```

5. **Test recommendation generation:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:latest",
  "prompt": "Suggest clothing for a 4-year-old in cold weather",
  "stream": false
}'
```

### Model Selection

**Recommended models for clothing recommendations:**

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| **mistral:latest** | 4GB | Fast | High | Recommended default |
| llama2:latest | 4GB | Fast | Good | Alternative, slightly faster |
| phi:latest | 1.6GB | Very fast | Moderate | Low-resource systems |
| llama2:13b | 7GB | Moderate | Very high | High-accuracy mode |

**Selection rationale:**
- **mistral:latest**: Best balance of speed, quality, and resource usage for this use case
- **Temperature 0.7**: Creative enough for varied recommendations, not too random
- **Max tokens 500**: Sufficient for structured recommendations with reasons

### Graceful Degradation

**Handling Ollama service unavailability:**

1. **Server returns fallback recommendations** if Ollama is down:
```javascript
if (ollamaError.code === 'ECONNREFUSED') {
  console.warn('Ollama unavailable, using rule-based fallback');
  return generateRuleBasedRecommendations(profile, weather, promptContext);
}
```

2. **Frontend shows appropriate messaging:**
```javascript
if (error.code === 'OLLAMA_SERVICE_UNAVAILABLE') {
  showNotification('Using basic recommendations - AI service unavailable');
}
```

3. **Health check endpoint reports Ollama status:**
```javascript
// GET /api/health
{
  "status": "ok",
  "services": {
    "ollama": "available" | "unavailable" | "degraded"
  }
}
```

### Testing Strategy

**Unit tests (mock Ollama responses):**
```javascript
// packages/server/tests/unit/ollamaService.test.js
describe('ollamaService', () => {
  it('builds correct prompt for 4yo girl', () => {
    const prompt = buildPromptForOllama(
      { age: 4, gender: 'girl', id: '4yo-girl' },
      { temperature: 35, conditions: 'Rain' },
      'playground'
    );

    expect(prompt).toContain('4-year-old girl');
    expect(prompt).toContain('Activity context: playground');
  });
});
```

**Integration tests (require Ollama running):**
```javascript
// packages/server/tests/integration/recommendations.test.js
describe('POST /api/recommendations (with Ollama)', () => {
  before(async () => {
    // Skip if Ollama not available
    const ollamaAvailable = await checkOllamaHealth();
    if (!ollamaAvailable) {
      this.skip();
    }
  });

  it('generates unique recommendations for different profiles', async () => {
    const request = { profile: { id: '4yo-girl', age: 4, gender: 'girl' }, weather: {...} };
    const response = await supertest(app).post('/api/recommendations').send(request);

    expect(response.body.recommendations).toBeDefined();
    expect(response.body.spokenResponse).toBeTruthy();
  });
});
```

### Migration Path

**Phase 1: Frontend mocks** (Current phase)
- Create 3 mock responses matching Ollama format
- Frontend uses mocks with `VITE_USE_MOCK_OLLAMA=true`
- Server stub returns hardcoded responses

**Phase 2: Server integration** (Next phase)
- Implement `ollamaService.js` in server
- Add Ollama health checks
- Test with local Ollama instance

**Phase 3: Production deployment** (Future)
- Deploy Ollama on server infrastructure
- Configure appropriate model and resources
- Monitor inference latency and quality

---

## 5. Alternatives Considered

### Alternative 1: Direct API Calls (No Proxy)

**Approach**: Frontend calls weather API directly, implement recommendations client-side

**Rejected because:**
- Exposes API keys in frontend bundle (security risk)
- No rate limiting control (quota overages)
- Harder to migrate recommendation logic later
- CORS configuration required for every API

### Alternative 2: Serverless Functions

**Approach**: Use Vercel/Netlify serverless functions instead of Express

**Rejected because:**
- Cold start latency (400-1000ms) impacts user experience
- More complex to test locally
- Harder to implement rate limiting across functions
- Weatherman targets consistent response times (< 2s)

### Alternative 3: GraphQL API

**Approach**: Use GraphQL instead of REST for server API

**Rejected because:**
- Overkill for simple proxy and recommendation endpoints
- Adds complexity (schema, resolvers, client setup)
- REST is simpler for this use case
- Can migrate later if needed

### Alternative 4: TypeScript Monorepo

**Approach**: Convert entire codebase to TypeScript

**Deferred because:**
- Significant migration effort outside scope of this feature
- JavaScript works fine for current scale
- Can be added incrementally later
- Focus on architecture first, types second

---

## 6. Key Decisions Summary

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| **Monorepo Tool** | npm workspaces | Native, simple, sufficient for 2 packages |
| **Package Manager** | npm | Consistent with Node 22+, no tooling change |
| **Server Framework** | Express.js 4.x | Industry standard, mature, flexible |
| **Server Architecture** | Three-layer (Routes/Controllers/Services) | Separation of concerns, testability |
| **Request Validation** | express-validator | Robust, chainable, includes sanitization |
| **Rate Limiting** | express-rate-limit | Simple, in-memory, upgradeable to Redis |
| **Error Handling** | Custom classes + global middleware | Centralized, consistent error responses |
| **Testing** | Vitest + Supertest | Fast, consistent with frontend, HTTP-specific |
| **Development Proxy** | Vite proxy | No CORS issues, simple config |
| **Production Config** | Environment variables | Flexible, secure, no hardcoded URLs |
| **Caching Strategy** | Network-First with cache fallback | Fresh data priority, offline support |
| **Package Naming** | @weatherman/* scope | Professional, clear ownership |
| **Voice Prompt Analysis** | Keyword pattern matching | Context extraction from user voice input for personalized recommendations |
| **LLM Service** | Ollama (local) | Locally hosted inference, no API costs, privacy-preserving, sub-second response times |
| **Mock Strategy** | Frontend mocks for 3 profiles | Rapid development without blocking on Ollama setup, deterministic testing |
| **Ollama Model** | mistral:latest | Best balance of speed, quality, and resource usage (4GB, fast inference) |

---

## 6. Implementation Risks & Mitigations

### Risk 1: Breaking Existing PWA Functionality

**Impact**: High - Core feature of Weatherman
**Mitigation**:
- Service Worker paths remain relative to frontend package
- Test PWA score after migration (must maintain 100/100)
- Preserve all existing caching strategies
- Test offline mode thoroughly

### Risk 2: Service Worker Not Caching Server Responses

**Impact**: Medium - Offline functionality degraded
**Mitigation**:
- Explicit Workbox configuration for `/api/*` patterns
- Test offline mode with DevTools Network throttling
- Verify cache entries in Application > Cache Storage
- Monitor cache hit rates in production

### Risk 3: Development Workflow Complexity

**Impact**: Low - Developer productivity
**Mitigation**:
- Single command (`npm run dev`) to run both servers
- Clear error messages when servers fail to start
- Health check endpoint for quick verification
- Document common issues in quickstart guide

### Risk 4: Rate Limiting Too Strict

**Impact**: Medium - User experience degradation
**Mitigation**:
- Start with generous limits (100 req/15min for weather)
- Monitor actual usage patterns
- Different limits per endpoint
- Clear error messages when limit exceeded
- Frontend retries with exponential backoff

### Risk 5: API Key Exposure During Migration

**Impact**: High - Security vulnerability
**Mitigation**:
- Move API keys to server environment variables first
- Update frontend to call server proxy before removing direct API calls
- Verify API keys not in frontend bundle (inspect dist)
- Add .env to .gitignore
- Never commit API keys

---

## 7. Success Criteria Validation

Mapping research decisions to spec success criteria:

| Success Criterion | Research Decision | Validation |
|-------------------|-------------------|------------|
| **SC-001**: No added latency | Vite proxy in dev, direct calls in prod | Measure response times before/after |
| **SC-002**: 100% profile differentiation | Server-side recommendation logic | Test all profile combinations |
| **SC-003**: 100 concurrent requests | Express + rate limiting | Load testing with Vitest |
| **SC-004**: No quota overages | express-rate-limit | Monitor external API calls |
| **SC-005**: < 2s recommendations | Network-First caching | Performance testing |
| **SC-006**: Zero credential exposure | Server-side API keys | Bundle analysis |
| **SC-007**: Single command startup | concurrently | Test `npm run dev` |
| **SC-008**: More varied recommendations | Rule-based service logic | Comparison testing |

---

## 8. Next Steps

**Phase 1: Design & Contracts** (Current phase output)
- ✅ Data model defined (data-model.md)
- ✅ API contracts created (contracts/weather-proxy.yaml, recommendations.yaml)
- ✅ Quickstart guide prepared (quickstart.md)

**Phase 2: Implementation Tasks** (Next command: /speckit.tasks)
- Generate detailed implementation tasks
- Assign priority and dependencies
- Create task breakdown for monorepo conversion, server creation, frontend integration

---

## Sources

This research consolidates findings from:

**Monorepo & npm Workspaces:**
- [Complete Monorepo Guide: pnpm + Workspace + Changesets](https://jsdev.space/complete-monorepo-guide/)
- [npm workspaces Official Documentation](https://docs.npmjs.com/cli/v8/using-npm/workspaces/)
- [Mastering npm Workspaces Guide](https://medium.com/@90mandalchandan/mastering-npm-workspaces)

**Express Architecture:**
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Node.js Error Handling Best Practices](https://www.freecodecamp.org/news/node-js-error-handling-best-practices/)
- [express-validator Documentation](https://express-validator.github.io/docs/)

**Frontend Integration:**
- [Vite Proxy Configuration Guide](https://vite.dev/config/server-options.html#server-proxy)
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview)
- [PWA Service Worker Best Practices](https://web.dev/service-worker-lifecycle/)
