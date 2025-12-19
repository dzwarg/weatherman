# Implementation Plan: Monorepo Architecture with Server Component

**Branch**: `002-monorepo-server` | **Date**: 2025-12-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-monorepo-server/spec.md`

## Summary

Convert the single Weatherman PWA into a monorepo structure with two packages: a React frontend (PWA) and a Node.js server component. The server will proxy weather API requests (securing credentials) and provide a dynamic clothing recommendation service powered by locally hosted **Ollama LLM service (mistral:latest)**. Recommendations are generated based on user profiles, weather conditions, and voice prompt context analysis.

**Development Strategy**: During initial development, the frontend will use **mocked Ollama responses** for the three user profiles (4yo girl, 7yo boy, 10yo boy) to enable rapid frontend iteration without blocking on Ollama setup. The mock responses will match the exact Ollama API format for seamless transition to real Ollama integration.

The frontend will capture user voice input and send it to the server for AI-powered, context-aware recommendations (e.g., "playground", "party", "school"), replacing hardcoded logic while maintaining all existing PWA capabilities and voice interaction features.

## Technical Context

**Language/Version**: JavaScript ES2022+ with Node 22+

**Primary Dependencies**:
- Frontend: React 22+, Vite 5+, PWA plugin, Web Speech API
- Server: Express.js 4+, axios for HTTP client, Ollama integration
- Monorepo: npm workspaces

**Storage**:
- Frontend: IndexedDB/localStorage for user profiles (existing)
- Server: Stateless (no database)
- Ollama: Local model storage (~4GB for mistral:latest)

**Testing** (Required):
- Frontend: Vitest + Testing Library (existing) - Update tests for server API integration
- Server Unit Tests: Vitest for all services (weather proxy, recommendations, Ollama, validators)
- Server Integration Tests: Supertest for all API endpoints with full request/response validation
- Contract Tests: Verify API contracts match OpenAPI specifications
- E2E Tests: Complete workflow from voice input through server to response
- Coverage Target: 80%+ for server code, all critical paths must be tested
- Ollama tests: Mock Ollama responses for unit tests; skip integration tests if Ollama unavailable

**Target Platform**:
- Frontend: Progressive Web App (browser-based, mobile-first)
- Server: Node.js runtime (localhost dev, deployable to cloud)
- Ollama: Local GPU/CPU inference (http://localhost:11434)

**Project Type**: Web application with separate frontend and backend packages in monorepo

**Performance Goals**:
- Weather proxy: No added latency vs direct API calls (excluding network overhead)
- Recommendations: < 2 seconds response time (including Ollama inference)
- Ollama inference: < 1 second for 500 token responses
- Concurrent requests: 100+ without degradation

**Constraints**:
- Frontend must maintain 100/100 Lighthouse PWA score
- Voice features must remain hands-free and offline-capable
- Service Workers must continue caching weather data
- Server becomes single point of failure (requires error handling)
- All existing frontend features must work unchanged
- **Ollama service may be unavailable**: Server must gracefully fallback to rule-based recommendations

**Scale/Scope**:
- Single-user households to small families (< 10 concurrent users expected)
- 2 packages in monorepo (frontend, server)
- ~15-20 new server endpoints
- Migrate existing recommendation logic (~500 LOC) from frontend to server
- Add Ollama service integration (~300 LOC)
- Add voice prompt analysis for contextual recommendations (~200 LOC)
- Create 3 frontend mock responses matching Ollama format (~100 LOC)
- **Add comprehensive test suite (~800 LOC)**:
  - Server unit tests for all services and utilities
  - Integration tests for all API endpoints
  - Updated frontend tests for server integration
  - E2E test for complete voice workflow

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Voice-First Interaction ✓
**Status**: COMPLIANT - ENHANCED
- Server changes enhance voice interaction with contextual recommendations powered by Ollama LLM
- Frontend maintains Web Speech API for voice input/output
- Voice parameters remain child-friendly (rate: 0.9, pitch: 1.1)
- All voice features continue to work offline (recommendations cached by Service Worker)
- **Enhancement**: User voice prompts now analyzed by Ollama for deep context understanding (activities, occasions, locations, moods)
- **Mock Strategy**: Frontend mocks enable voice feature development without Ollama dependency

### Progressive Web App Architecture ✓
**Status**: COMPLIANT
- Service Workers remain unchanged in frontend package
- Caching strategies preserved (Cache First for static, Network First for API)
- Server API responses (including Ollama-generated recommendations) will be cached by existing weather cache mechanism
- HTTPS maintained (required for Service Workers)
- Lighthouse PWA score target: 100/100
- **Note**: Ollama integration is server-side only, no impact on PWA features

**Note**: Server responses for recommendations will be cached client-side using existing cache service

### Spec-Driven Development ✓
**Status**: COMPLIANT
- Branch: `002-monorepo-server`
- Spec exists: `./specs/002-monorepo-server/spec.md`
- Tasks will be generated: `./specs/002-monorepo-server/tasks.md`
- All acceptance criteria defined in spec
- **Ollama Integration**: Fully documented in research.md, data-model.md, and API contracts

### Quality-First Development ✓
**Status**: COMPLIANT - ENHANCED REQUIREMENTS
- Existing frontend tests remain and must be updated for server API integration
- **New server tests REQUIRED (not optional)**:
  - Unit tests for ALL services (weather proxy, recommendations, Ollama, prompt analysis)
  - Unit tests for ALL validators and utilities
  - Integration tests for ALL API endpoints with Supertest
  - Contract tests verifying API matches OpenAPI specifications
  - E2E test for complete voice → server → response workflow
  - Tests for error handling, timeouts, and rate limiting
  - Tests for Ollama fallback behavior
  - 80%+ code coverage target for server package
- ESLint configuration extends to server package (zero warnings)
- Test coverage reports required for server package

**Quality Gates (All Must Pass)**:
- Server unit tests: `npm run test:unit --workspace=@weatherman/server` (must pass)
- Server integration tests: `npm run test:integration --workspace=@weatherman/server` (must pass)
- Frontend tests: `npm run test --workspace=@weatherman/frontend` (must pass with server integration)
- Server lint: `npm run lint --workspace=@weatherman/server` (zero warnings)
- Code coverage: Server package must maintain 80%+ coverage
- All tests must pass before any commit to main branch

### Signed & Conventional Commits ✓
**Status**: COMPLIANT
- Existing GPG signing continues
- Conventional commits format maintained
- Scope will use "monorepo", "server", "frontend", or "ollama" as appropriate

**Example commits**:
```
feat(monorepo): setup npm workspaces structure
feat(server): add weather proxy endpoint
feat(server): implement Ollama LLM integration for recommendations
feat(server): add fallback rule-based recommendations
feat(frontend): create mocked Ollama responses for profiles
feat(frontend): integrate server recommendation API
refactor(frontend): remove hardcoded recommendation logic
docs(ollama): add Ollama setup guide to quickstart
```

### Child-Friendly & Family-Focused ✓
**Status**: COMPLIANT - ENHANCED
- **Ollama prompt engineering**: Prompts explicitly request child-friendly language and age-appropriate vocabulary
- Server generates age-appropriate recommendations (ages 4-10) via Ollama
- Profile-aware responses (4yo girl, 7yo boy, 10yo boy) with appropriate complexity
- Voice feedback parameters unchanged in frontend
- Quick response times maintained (< 3 second total interaction including Ollama)
- **LLM Safety**: Ollama runs locally with controlled prompts, no external data transmission

### Privacy & Security First ✓
**Status**: ENHANCED
- Weather API keys moved from frontend to server (SECURITY IMPROVEMENT)
- API keys now in server environment variables only
- Voice processing remains in-browser (unchanged)
- **User voice prompts are sent to server for Ollama processing** (server-side only, no external APIs)
- User profiles continue to be stored locally on device
- **Ollama runs locally**: No voice data transmitted to external services (privacy-preserving)
- Server validates all incoming requests
- HTTPS required for frontend-server communication

**Security Improvements**:
- API credentials no longer exposed in frontend bundle
- Server-side rate limiting prevents API quota abuse
- Request validation prevents malformed data processing
- **Local LLM inference**: No dependency on external AI APIs, reducing attack surface

### Constitution Violations

**NONE** - All constitutional requirements maintained or enhanced.

**Ollama Integration Benefits**:
- Privacy-preserving (local inference, no external APIs)
- Enhanced voice interaction (deep context understanding)
- Age-appropriate content (enforced via prompt engineering)
- No additional external dependencies
- Graceful degradation if Ollama unavailable

## Project Structure

### Documentation (this feature)

```text
specs/002-monorepo-server/
├── plan.md              # This file
├── research.md          # Phase 0: Technology decisions and patterns (with Ollama section)
├── data-model.md        # Phase 1: Data structures and entities (including Ollama formats)
├── quickstart.md        # Phase 1: Developer setup guide (with Ollama setup)
├── contracts/           # Phase 1: API contracts
│   ├── weather-proxy.yaml       # Weather proxy OpenAPI spec
│   └── recommendations.yaml     # Recommendations API OpenAPI spec (updated for Ollama)
└── tasks.md             # Phase 2: Implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
# Monorepo Root
package.json                    # Root package.json with workspaces config
.npmrc                          # Workspace configuration (if needed)

# Frontend Package (existing code moves here)
packages/frontend/
├── package.json                # Frontend-specific dependencies
├── vite.config.js              # Vite config (unchanged)
├── vitest.config.js            # Test config (unchanged)
├── eslint.config.js            # ESLint config (unchanged)
├── public/                     # Static assets (unchanged)
│   ├── manifest.json
│   ├── icons/
│   └── sw.js
├── src/                        # React application (mostly unchanged)
│   ├── components/             # UI components
│   ├── pages/                  # Page components
│   ├── hooks/                  # React hooks
│   ├── services/               # MODIFIED: API clients for server
│   │   ├── weatherService.js   # MODIFIED: Call server proxy
│   │   ├── recommendationService.js  # MODIFIED: Call server API or use mocks
│   │   ├── voiceService.js     # Unchanged
│   │   ├── cacheService.js     # Unchanged
│   │   ├── profileService.js   # Unchanged
│   │   └── storageService.js   # Unchanged
│   ├── mocks/                  # NEW: Mock Ollama responses for development
│   │   └── ollama/
│   │       ├── 4yo-girl-cold-rainy.json
│   │       ├── 7yo-boy-moderate.json
│   │       └── 10yo-boy-hot-sunny.json
│   ├── models/                 # Data models (unchanged)
│   ├── utils/                  # MODIFIED: Remove clothingRules.js
│   │   └── clothingRules.js    # MOVE TO SERVER (or delete if using Ollama)
│   ├── styles/                 # CSS (unchanged)
│   ├── App.jsx                 # Main app (unchanged)
│   ├── main.jsx                # Entry point (unchanged)
│   └── registerServiceWorker.js # SW registration (unchanged)
├── .env.development            # NEW: VITE_USE_MOCK_OLLAMA=true
├── .env.production             # NEW: VITE_USE_MOCK_OLLAMA=false
└── tests/                      # Tests (updated for server API)
    ├── setup.js
    ├── unit/
    ├── integration/
    └── e2e/

# Server Package (new)
packages/server/
├── package.json                # Server dependencies (Express, axios, etc.)
├── .env.example                # Example env vars (API keys, Ollama config)
├── .gitignore                  # Ignore .env, node_modules
├── src/
│   ├── server.js               # Express app setup and start
│   ├── config/                 # Configuration
│   │   ├── env.js              # Environment variable loading
│   │   └── constants.js        # App constants (Ollama model, timeout)
│   ├── routes/                 # Express routes
│   │   ├── weather.js          # Weather proxy endpoints
│   │   └── recommendations.js  # Recommendation endpoints
│   ├── services/               # Business logic
│   │   ├── weatherProxyService.js    # Weather API proxy
│   │   ├── ollamaService.js          # NEW: Ollama LLM integration
│   │   ├── recommendationService.js  # Orchestrates Ollama + fallback
│   │   └── promptAnalysisService.js  # Voice prompt context analysis
│   ├── utils/                  # Utilities
│   │   ├── clothingRules.js    # Fallback rule-based logic (if Ollama unavailable)
│   │   ├── ollamaResponseParser.js  # NEW: Parse Ollama free-text responses
│   │   ├── promptKeywords.js   # Context keyword patterns
│   │   ├── validation.js       # Request validation
│   │   └── rateLimiter.js      # Rate limiting logic
│   └── middleware/             # Express middleware
│       ├── errorHandler.js     # Error handling
│       ├── requestLogger.js    # Request logging
│       ├── cors.js             # CORS configuration
│       └── rateLimiter.js      # Rate limiting middleware
└── tests/                      # Server tests
    ├── setup.js
    ├── unit/                   # Unit tests for services
    │   ├── weatherProxyService.test.js
    │   ├── ollamaService.test.js           # NEW: Ollama mocked
    │   ├── recommendationService.test.js
    │   └── ollamaResponseParser.test.js    # NEW: Parser tests
    └── integration/            # API endpoint tests
        ├── weather.test.js
        └── recommendations.test.js          # Ollama optional (skipped if unavailable)

# Shared Documentation (repository root)
docs/                           # Existing documentation
├── product-details.md          # Product overview (updated)
├── technical-details.md        # Technical architecture (updated with Ollama)
└── workflow.md                 # Development workflow (updated)

# Shared Specifications
specs/                          # All feature specs
├── 001-voice-weather-clothing/ # Existing feature
└── 002-monorepo-server/        # This feature

# Root Configuration
.specify/                       # SpecKit configuration (unchanged)
.claude/                        # Claude Code configuration (updated)
└── settings.local.json         # Updated with server and Ollama context
```

**Structure Decision**: Web application monorepo structure selected. The existing single-app codebase will be moved into `packages/frontend/` with minimal changes, while a new `packages/server/` package will be created for the Node.js server component with Ollama integration. This structure:
- Allows independent versioning and deployment of frontend and server
- Shares common configuration at root level (ESLint, TypeScript if added later)
- Enables parallel development of both packages
- Maintains clear separation of concerns
- Follows industry-standard monorepo patterns (similar to Nx, Turborepo conventions)
- **Ollama Integration**: Server-side only, no impact on frontend package structure

## Complexity Tracking

> No violations identified - this section intentionally left empty.

All constitutional requirements are maintained or enhanced by this feature. The monorepo structure, server component, and Ollama LLM integration:
- Do not interfere with voice-first interaction (in fact, enhance it)
- Maintain PWA architecture and offline capabilities
- Enhance security by moving API credentials server-side
- Preserve privacy with local Ollama inference (no external AI API calls)
- Follow existing quality and commit standards
- Preserve child-friendly and privacy-first principles
- Gracefully degrade if Ollama service is unavailable

**Ollama-Specific Risk Mitigation**:
- Frontend mocks enable development without Ollama dependency
- Server fallback to rule-based recommendations if Ollama unavailable
- Health check endpoint reports Ollama service status
- Integration tests skip Ollama tests if service not running
- Clear documentation for Ollama setup in quickstart.md

## Dependencies

**New Ollama-Specific Dependencies**:
- Ollama service running locally (http://localhost:11434)
- Ollama model: mistral:latest (~4GB download)
- Server package: axios for Ollama HTTP client
- Server package: Ollama response parsing utilities

**Existing Dependencies** (from original plan):
- npm workspaces for monorepo management
- Server framework (Express.js)
- HTTP client library for server-to-weather-API communication
- Existing weather API access and credentials
- CORS handling middleware for server
- Request validation library for server endpoints
- The existing frontend React application and its dependencies
- Node.js runtime environment compatible with both frontend build tools and server

## Migration Path

**Phase 1: Frontend Mocks** (Initial Development)
- Create 3 mock Ollama responses matching API format
- Frontend uses mocks with `VITE_USE_MOCK_OLLAMA=true`
- Server stub returns hardcoded responses (no Ollama integration yet)
- Enables parallel frontend and server development

**Phase 2: Server Ollama Integration** (After Frontend Complete)
- Implement `ollamaService.js` in server
- Add Ollama health checks
- Test with local Ollama instance
- Add fallback to rule-based recommendations

**Phase 3: Production Deployment** (Future)
- Deploy Ollama on server infrastructure (or keep local)
- Configure appropriate model and resources
- Monitor inference latency and quality
- Consider model alternatives based on performance

## Next Steps

**Phase 0 (Complete)**: ✓ Research.md created with Ollama integration decisions
**Phase 1 (Complete)**: ✓ Data model, API contracts, and quickstart guide created
**Phase 2 (Next)**: Run `/speckit.tasks` to generate implementation tasks
