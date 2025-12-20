# Tasks: Monorepo Architecture with Server Component

**Input**: Design documents from `/specs/002-monorepo-server/` \
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **REQUIRED** - All server endpoints and services must have comprehensive tests. Tests should be written BEFORE implementation (TDD approach) to ensure they fail first, then pass after implementation.

**Coverage Target**: 80%+ for server code, all critical paths must be tested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Tests are written first within each phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This project uses a **monorepo structure** with npm workspaces:
- **Frontend**: `packages/frontend/` (React PWA)
- **Server**: `packages/server/` (Express.js API)
- **Root**: Workspace configuration

---

## Phase 1: Setup (Monorepo Infrastructure)

**Purpose**: Convert single-app structure to monorepo with npm workspaces

- [X] T001 Create backup branch `backup-pre-monorepo` for safety
- [X] T002 Create monorepo directory structure: `packages/frontend/` and `packages/server/src/`
- [X] T003 [P] Move existing frontend code to `packages/frontend/` using `git mv` to preserve history (src/, public/, index.html, vite.config.js, vitest.config.js, eslint.config.js, tests/, scripts/)
- [X] T004 [P] Copy existing `package.json` to `packages/frontend/package.json` and update name to `@weatherman/frontend`
- [X] T005 [P] Create `packages/server/package.json` with Express dependencies (express, cors, helmet, dotenv, express-validator, express-rate-limit, axios)
- [X] T006 Create root `package.json` with npm workspaces configuration and concurrently for parallel dev servers
- [X] T007 Remove all `node_modules/` directories and `package-lock.json`, then run `npm install` to set up workspaces
- [X] T008 [P] Verify workspace symlinks exist in `node_modules/@weatherman/` for both packages
- [X] T009 Update `.gitignore` to include `packages/server/.env`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core server infrastructure and frontend proxy configuration that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Server Foundation

- [X] T010 Create basic Express app setup in `packages/server/src/server.js` with middleware (helmet, cors, express.json)
- [X] T011 [P] Create environment configuration in `packages/server/src/config/env.js` to load and validate environment variables
- [X] T012 [P] Create constants file in `packages/server/src/config/constants.js` for rate limits, timeouts, and Ollama settings
- [X] T013 [P] Create error handling middleware in `packages/server/src/middleware/errorHandler.js` with standardized error response format
- [X] T014 [P] Create request logger middleware in `packages/server/src/middleware/requestLogger.js`
- [X] T015 [P] Create CORS configuration in `packages/server/src/middleware/cors.js` for development and production origins
- [X] T016 Create health check endpoint `GET /api/health` in `packages/server/src/server.js` that returns server status
- [X] T017 [P] Create `.env.example` file in `packages/server/` with all required environment variables documented
- [X] T018 [P] Create `.env` file in `packages/server/` with actual API keys (not committed)

### Frontend Foundation

- [X] T019 Update Vite config in `packages/frontend/vite.config.js` to add proxy configuration for `/api/*` requests to `http://localhost:3000`
- [X] T020 [P] Create `.env.development` in `packages/frontend/` with `VITE_USE_MOCK_OLLAMA=true` and `VITE_API_BASE_URL=/api`
- [X] T021 [P] Create `.env.production` in `packages/frontend/` with `VITE_USE_MOCK_OLLAMA=false` and production API URL

### Testing Infrastructure Setup

- [X] T022 [P] Create Vitest config for server unit tests in `packages/server/vitest.config.js` with coverage enabled
- [X] T023 [P] Create test setup file in `packages/server/tests/setup.js` for common test utilities
- [X] T024 [P] Add test scripts to `packages/server/package.json`: `test`, `test:unit`, `test:integration`, `test:coverage`
- [X] T025 [P] Create test helper utilities in `packages/server/tests/helpers/` for mocking HTTP requests and Ollama responses

### Manual Validation

- [X] T026 Test frontend runs independently with `npm run dev:frontend` (should start on https://localhost:5173)
- [X] T027 Test server runs independently with `npm run dev:server` (should start on http://localhost:3000)
- [X] T028 Test both packages run together with `npm run dev` using concurrently
- [X] T029 Test health check endpoint responds: `curl http://localhost:3000/api/health`
- [X] T030 Test Vite proxy works: Open browser console at https://localhost:5173 and run `fetch('/api/health').then(r => r.json()).then(console.log)`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Backend Weather Proxying (Priority: P1) 🎯 MVP

**Goal**: Frontend requests weather data through the server component instead of calling the weather API directly. Server acts as a proxy with secure credential handling and rate limiting.

**Independent Test**: Make a weather request from the frontend, which routes through the server proxy to the weather API and returns the same weather data format the frontend currently expects.

### Tests for User Story 1 (Write FIRST - TDD Approach) ✅

**⚠️ IMPORTANT**: Write these tests FIRST, verify they FAIL, then implement code to make them pass.

**Unit Tests**:

- [X] T031 [P] [US1] Write unit tests for weather validator in `packages/server/tests/unit/validators/weatherValidator.test.js` (valid/invalid coordinates, units)
- [X] T032 [P] [US1] Write unit tests for weather proxy service in `packages/server/tests/unit/services/weatherProxyService.test.js` (success, timeout, error handling, data transformation)
- [X] T033 [P] [US1] Write unit tests for rate limiter in `packages/server/tests/unit/middleware/rateLimiter.test.js` (within limit, exceeded, reset)

**Integration Tests**:

- [X] T034 [P] [US1] Write integration test for POST `/api/weather/current` in `packages/server/tests/integration/weather.test.js` (successful request with valid coordinates)
- [X] T035 [P] [US1] Write integration test for invalid coordinates (400 error response)
- [X] T036 [P] [US1] Write integration test for rate limiting (429 error after exceeding limit)
- [X] T037 [P] [US1] Write integration test for weather API timeout (503 error after 5 seconds)

**Verify Tests Fail**: Run `npm run test --workspace=@weatherman/server` and confirm all tests fail (no implementation yet)

### Implementation for User Story 1

**Server Components**:

- [X] T038 [P] [US1] Create weather request validator in `packages/server/src/validators/weatherValidator.js` using express-validator (validate lat, lon, units)
- [X] T039 [P] [US1] Create rate limiter middleware in `packages/server/src/middleware/rateLimiter.js` for weather API (100 req/15min)
- [X] T040 [US1] Create weather proxy service in `packages/server/src/services/weatherProxyService.js` that calls external weather API with timeout (5s)
- [X] T041 [US1] Create weather routes in `packages/server/src/routes/weather.js` with POST `/api/weather/current` and POST `/api/weather/forecast` endpoints
- [X] T042 [US1] Create weather controller in `packages/server/src/controllers/weatherController.js` to handle request/response logic
- [X] T043 [US1] Integrate weather routes into Express app in `packages/server/src/server.js`
- [X] T044 [US1] Add error handling for weather API failures (timeout, connection refused, rate limit exceeded)

**Verify Tests Pass**: Run `npm run test --workspace=@weatherman/server` and confirm all User Story 1 tests now pass

**Frontend Integration**:

- [X] T045 [US1] Update weather service in `packages/frontend/src/services/weatherService.js` to call server proxy endpoints instead of direct API
- [X] T046 [US1] Create API client utility in `packages/frontend/src/services/apiClient.js` with base URL configuration from environment
- [X] T047 [US1] Update Service Worker config in `packages/frontend/vite.config.js` to cache server API responses with Network-First strategy
- [X] T048 [US1] Update frontend tests in `packages/frontend/tests/` to work with server API instead of direct weather API calls
- [X] T049 [US1] Test weather proxy end-to-end: Request weather from frontend UI and verify it returns through server proxy
- [X] T050 [US1] Verify API key is NOT exposed in frontend bundle (inspect `packages/frontend/dist/` after build)
- [X] T051 [US1] Run full test suite: `npm run test` and verify all tests pass (frontend + server)

**Checkpoint**: At this point, User Story 1 should be fully functional and TESTED - weather data flows through server proxy with secure credentials

---

## Phase 4: User Story 2 - Dynamic Clothing Recommendations Service (Priority: P2)

**Goal**: Server hosts a clothing recommendation service that generates personalized outfit suggestions based on user profile, weather, and voice prompt context, replacing hardcoded frontend logic.

**Independent Test**: Send a request with user profile, weather data, and optional voice prompt to the server's recommendation endpoint and receive back a customized clothing recommendation that differs based on all inputs.

### Tests for User Story 2 (Write FIRST - TDD Approach) ✅

**⚠️ IMPORTANT**: Write these tests FIRST, verify they FAIL, then implement code to make them pass.

**Unit Tests**:

- [X] T052 [P] [US2] Write unit tests for prompt analysis service in `packages/server/tests/unit/services/promptAnalysisService.test.js` (extract keywords from voice prompts)
- [X] T053 [P] [US2] Write unit tests for Ollama response parser in `packages/server/tests/unit/utils/ollamaResponseParser.test.js` (parse free-text to structured format)
- [X] T054 [P] [US2] Write unit tests for clothing rules fallback in `packages/server/tests/unit/utils/clothingRules.test.js` (all profiles and weather conditions)
- [X] T055 [P] [US2] Write unit tests for Ollama service in `packages/server/tests/unit/services/ollamaService.test.js` (mock Ollama API, test prompt building, response handling, error handling)
- [X] T056 [P] [US2] Write unit tests for recommendation service in `packages/server/tests/unit/services/recommendationService.test.js` (orchestration, fallback logic, all profiles)
- [X] T057 [P] [US2] Write unit tests for recommendation validator in `packages/server/tests/unit/validators/recommendationValidator.test.js` (valid/invalid profiles, weather data, prompts)

**Integration Tests**:

- [X] T058 [P] [US2] Write integration test for POST `/api/recommendations` with valid request in `packages/server/tests/integration/recommendations.test.js`
- [X] T059 [P] [US2] Write integration test for invalid profile ID (400 error)
- [X] T060 [P] [US2] Write integration test for missing required fields (400 error)
- [X] T061 [P] [US2] Write integration test for GET `/api/recommendations/profiles` endpoint
- [X] T062 [P] [US2] Write integration test for Ollama fallback behavior (with Ollama service mocked as unavailable)
- [X] T063 [P] [US2] Write integration test verifying different profiles get different recommendations for same weather

**Verify Tests Fail**: Run `npm run test --workspace=@weatherman/server` and confirm all User Story 2 tests fail

### Frontend Mock Implementation (Enable Parallel Development)

- [X] T064 [P] [US2] Create mock Ollama response for 4yo girl in cold/rainy weather in `packages/frontend/src/mocks/ollama/4yo-girl-cold-rainy.json`
- [X] T065 [P] [US2] Create mock Ollama response for 7yo boy in moderate weather in `packages/frontend/src/mocks/ollama/7yo-boy-moderate.json`
- [X] T066 [P] [US2] Create mock Ollama response for 10yo boy in hot/sunny weather in `packages/frontend/src/mocks/ollama/10yo-boy-hot-sunny.json`
- [X] T067 [US2] Update recommendation service in `packages/frontend/src/services/recommendationService.js` to check `VITE_USE_MOCK_OLLAMA` and return mocks when true

### Server Ollama Integration

**Ollama Service Layer**:

- [X] T068 [P] [US2] Create prompt analysis service in `packages/server/src/services/promptAnalysisService.js` to extract context keywords from voice prompts
- [X] T069 [P] [US2] Create Ollama response parser in `packages/server/src/utils/ollamaResponseParser.js` to parse free-text LLM output into structured format
- [X] T070 [P] [US2] Create clothing rules fallback in `packages/server/src/utils/clothingRules.js` (copy from frontend) for when Ollama is unavailable
- [X] T071 [US2] Create Ollama service in `packages/server/src/services/ollamaService.js` to call Ollama API (POST http://localhost:11434/api/generate) with structured prompts
- [X] T072 [US2] Create recommendation service in `packages/server/src/services/recommendationService.js` that orchestrates Ollama calls + fallback logic
- [X] T073 [US2] Add Ollama health check to health endpoint in `packages/server/src/server.js` (check if http://localhost:11434 is reachable)

**API Layer**:

- [X] T074 [P] [US2] Create recommendation request validator in `packages/server/src/validators/recommendationValidator.js` (validate profile, weather, prompt)
- [X] T075 [P] [US2] Create rate limiter for recommendations endpoint in `packages/server/src/middleware/rateLimiter.js` (500 req/15min)
- [X] T076 [US2] Create recommendation routes in `packages/server/src/routes/recommendations.js` with POST `/api/recommendations` and GET `/api/recommendations/profiles`
- [X] T077 [US2] Create recommendation controller in `packages/server/src/controllers/recommendationsController.js` to handle requests
- [X] T078 [US2] Integrate recommendation routes into Express app in `packages/server/src/server.js`

**Verify Tests Pass**: Run `npm run test --workspace=@weatherman/server` and confirm all User Story 2 tests now pass

**Frontend Integration**:

- [ ] T079 [US2] Update recommendation service in `packages/frontend/src/services/recommendationService.js` to call server API when `VITE_USE_MOCK_OLLAMA=false`
- [ ] T080 [US2] Remove hardcoded clothing recommendation logic from `packages/frontend/src/utils/clothingRules.js` (or delete file)
- [ ] T081 [US2] Update clothing recommendation flow to include voice prompt in request payload to server
- [ ] T082 [US2] Update Service Worker to cache recommendation responses with 30-minute expiry
- [ ] T083 [US2] Add offline indicator component in `packages/frontend/src/components/OfflineIndicator.jsx` to show when server is unavailable
- [ ] T084 [US2] Test recommendations end-to-end with mocks: Verify different profiles get different recommendations
- [ ] T085 [US2] Test recommendations with Ollama (if available): Set `VITE_USE_MOCK_OLLAMA=false` and verify LLM-generated responses
- [ ] T086 [US2] Test fallback behavior: Stop Ollama service and verify rule-based recommendations still work
- [ ] T087 [US2] Run full test suite: `npm run test` and verify all tests pass (frontend + server, including User Story 2)

**Checkpoint**: At this point, User Story 2 should be fully functional and TESTED - dynamic, personalized recommendations work with comprehensive test coverage

---

## Phase 5: User Story 3 - Monorepo Package Management (Priority: P3)

**Goal**: Codebase is structured as a monorepo with separate packages for frontend and server, allowing independent development, testing, and deployment while sharing common configurations.

**Independent Test**: Run frontend and server packages independently with their own development commands, verify shared code is accessible, and confirm changes to one package don't require rebuilding the other unless shared code changes.

### Implementation for User Story 3

**Note**: Most of User Story 3 was completed in Phase 1 (Setup) and Phase 2 (Foundational). This phase focuses on refinement and documentation.

- [X] T088 [P] [US3] Create root-level README.md section documenting monorepo structure and npm workspace commands
- [ ] T089 [P] [US3] Update `packages/frontend/README.md` with frontend-specific setup and development instructions
- [X] T090 [P] [US3] Update `packages/server/README.md` with server-specific setup, Ollama configuration, and API documentation
- [ ] T091 [US3] Test independent frontend installation: Run `npm install --workspace=@weatherman/frontend` and verify only frontend deps are installed
- [ ] T092 [US3] Test independent server installation: Run `npm install --workspace=@weatherman/server` and verify only server deps are installed
- [ ] T093 [US3] Test workspace dependency hoisting: Verify shared dependencies (e.g., vitest) are hoisted to root `node_modules/`
- [X] T094 [US3] Create developer workflow documentation in `docs/workflow.md` explaining monorepo commands, parallel development, and common issues
- [ ] T095 [US3] Verify `npm run build` builds both packages correctly
- [ ] T096 [US3] Verify `npm run test` runs tests for both packages (all tests should pass)
- [ ] T097 [US3] Verify `npm run lint` lints both packages (zero warnings)

**Checkpoint**: All user stories should now be independently functional with proper monorepo tooling, documentation, and comprehensive test coverage

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and production readiness

**Note**: Core tests were written during Phase 3 and Phase 4. This phase focuses on E2E tests and additional quality gates.

### Documentation

- [X] T098 [P] Update `docs/product-details.md` to reflect monorepo architecture and server component features
- [X] T099 [P] Update `docs/technical-details.md` with server architecture, Ollama integration, and API documentation
- [X] T100 [P] Update root README.md with quickstart instructions for monorepo setup and development
- [X] T101 [P] Add Ollama setup guide to `docs/ollama-setup.md` with installation instructions for macOS, Linux, Windows

### End-to-End Testing (Required)

- [ ] T102 [P] Write E2E test for complete voice workflow in `packages/frontend/tests/e2e/voice-workflow.test.js` (voice input → frontend → server → response → voice output)
- [ ] T103 [P] Write E2E test for offline functionality with Service Worker caching
- [ ] T104 [P] Write contract tests verifying API responses match OpenAPI specifications in `packages/server/tests/contract/`

### Production Readiness

- [ ] T105 [P] Add production CORS configuration in `packages/server/src/middleware/cors.js` with environment-based origin allowlist
- [ ] T106 [P] Add production environment variables example in `packages/server/.env.production.example`
- [ ] T107 [P] Configure server to serve frontend static build in production mode (optional - for monolith deployment)
- [ ] T108 Review security: Ensure no API keys in frontend bundle, validate all user inputs, proper error messages
- [ ] T109 Review PWA compliance: Run Lighthouse audit and ensure 100/100 PWA score is maintained
- [ ] T110 Review voice interaction: Test all voice features work with server integration (capture, playback, offline mode)

### Performance Optimization

- [ ] T111 [P] Add response compression middleware in server (e.g., compression package)
- [ ] T112 [P] Optimize Ollama prompt templates for faster inference (reduce token count)
- [ ] T113 Measure and document server response times (weather proxy < 100ms overhead, recommendations < 2s total)
- [ ] T114 Test concurrent load: Verify server handles 100+ concurrent requests without degradation

### Code Quality & Coverage

- [ ] T115 [P] Run ESLint on all packages and fix any warnings (must be zero warnings)
- [ ] T116 [P] Add JSDoc comments to all public service methods
- [ ] T117 Review and remove any console.log statements (replace with proper logging)
- [ ] T118 Add error logging to server (consider adding winston or pino logger)
- [ ] T119 Generate and review test coverage report: `npm run test:coverage --workspace=@weatherman/server`
- [ ] T120 Verify 80%+ test coverage for server package (must meet requirement)

### Final Validation

- [ ] T121 Run complete quickstart.md validation end-to-end with fresh clone
- [ ] T122 Test deployment scenario: Build both packages and verify production configuration works
- [ ] T123 Create deployment documentation in `docs/deployment.md` for separate frontend/server deployment
- [ ] T124 Run full test suite one final time: `npm run test` (all tests must pass)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - Can run independently
- **User Story 2 (Phase 4)**: Depends on Foundational completion - Can run in parallel with US1, but typically done after US1 for clarity
- **User Story 3 (Phase 5)**: Mostly complete in Phase 1 & 2 - Just documentation and validation
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Backend Weather Proxying)**: No dependencies on other user stories - Establishes server infrastructure
- **User Story 2 (P2 - Dynamic Recommendations)**: Technically independent, but benefits from US1's server foundation being proven
- **User Story 3 (P3 - Monorepo Management)**: Infrastructure completed in Phase 1 - Just needs documentation

### Critical Path

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS everything
    ↓
Phase 3 (US1 - Weather Proxy) ← MVP completion point
    ↓
Phase 4 (US2 - Recommendations)
    ↓
Phase 5 (US3 - Monorepo docs)
    ↓
Phase 6 (Polish)
```

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003 (move frontend) || T004 (frontend package.json) || T005 (server package.json)
- T008 (verify symlinks) || T009 (update gitignore)

**Phase 2 (Foundational)**:
- All server foundation tasks (T011-T015) can run in parallel
- Frontend foundation tasks (T020-T021) can run in parallel
- Server and frontend foundation can proceed in parallel

**Phase 4 (US2 - Recommendations)**:
- Frontend mocks (T039-T041) can all be created in parallel
- Ollama service layer (T043-T045) can be developed in parallel
- API layer validators and rate limiters (T049-T050) can be developed in parallel

**Phase 6 (Polish)**:
- All documentation tasks (T072-T075) can run in parallel
- All test tasks (T076-T081) can run in parallel
- All security/performance review tasks can run in parallel

---

## Parallel Example: Phase 4 (User Story 2)

```bash
# Create all frontend mocks together:
Task T039: "Create 4yo-girl-cold-rainy.json mock"
Task T040: "Create 7yo-boy-moderate.json mock"
Task T041: "Create 10yo-boy-hot-sunny.json mock"

# Build Ollama service layer in parallel:
Task T043: "Create prompt analysis service"
Task T044: "Create Ollama response parser"
Task T045: "Create clothing rules fallback"

# Build API validators in parallel:
Task T049: "Create recommendation validator"
Task T050: "Create rate limiter for recommendations"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T009) - Establish monorepo structure
2. Complete Phase 2: Foundational (T010-T026) - CRITICAL - blocks all stories
3. Complete Phase 3: User Story 1 (T027-T038) - Weather proxy working
4. **STOP and VALIDATE**: Test weather proxy independently with frontend
5. **MVP COMPLETE**: Secure weather API proxying functional

**At this checkpoint, you have a deployable system with improved security (API keys on server)**

### Incremental Delivery

1. MVP (US1): Weather proxy → Deploy/Demo
2. Add US2: Dynamic recommendations → Deploy/Demo (major feature enhancement)
3. Add US3 docs: Monorepo documentation → Developer experience improved
4. Polish: Testing, performance, production readiness → Production deployment

Each user story adds value without breaking previous functionality.

### Parallel Team Strategy

With multiple developers:

1. **Team completes Phase 1 + 2 together** (foundation must be solid)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Weather proxy) - T027-T038
   - **Developer B**: User Story 2 frontend mocks (T039-T042) - enables parallel work
3. After US1 complete:
   - **Developer A**: User Story 2 server implementation (T043-T061)
   - **Developer B**: User Story 3 documentation (T062-T071)
4. Polish phase can be divided across team

---

## Notes

- **[P] tasks**: Can run in parallel - different files, no dependencies
- **[Story] label**: Maps task to specific user story (US1, US2, US3) for traceability
- **Ollama Optional**: System works with mocks and fallback logic if Ollama unavailable
- **Tests Optional**: Included but can be deferred - spec does not require test-driven approach
- **Commit Frequently**: Commit after each logical task group (e.g., after completing a service layer)
- **Stop at Checkpoints**: Validate each user story independently before proceeding
- **Security First**: Always verify API keys are not exposed in frontend bundle after changes

---

## Summary Statistics

- **Total Tasks**: 124 tasks
- **Phase 1 (Setup)**: 9 tasks
- **Phase 2 (Foundational)**: 21 tasks (includes test infrastructure)
- **Phase 3 (US1 - Weather Proxy)**: 21 tasks (7 tests + 14 implementation)
- **Phase 4 (US2 - Recommendations)**: 35 tasks (12 tests + 23 implementation)
- **Phase 5 (US3 - Monorepo Docs)**: 10 tasks
- **Phase 6 (Polish)**: 27 tasks (includes E2E tests, coverage validation)

**Test Breakdown**:
- Unit tests: 13 test tasks (covering all services, validators, utilities)
- Integration tests: 13 test tasks (covering all API endpoints)
- E2E tests: 3 test tasks (voice workflow, offline, contracts)
- **Total test tasks**: 29 tasks (~23% of all tasks)

**Parallel Opportunities**: 50+ tasks marked [P] can run in parallel within their phases

**MVP Scope (Recommended First Delivery)**: Phase 1 + Phase 2 + Phase 3 = 51 tasks (User Story 1 complete with tests)

**Testing Requirements**:
- All tests must be written BEFORE implementation (TDD approach)
- All tests must pass before moving to next phase
- 80%+ code coverage required for server package
- Zero ESLint warnings required

**Expected Implementation Time**:
- MVP (US1 with tests): Foundation for server infrastructure and secure weather proxy, fully tested
- Full Feature (US1 + US2 with tests): Complete dynamic recommendations with Ollama, comprehensive test coverage
- Production Ready (All Phases): Tested (80%+ coverage), documented, optimized, production-ready system

---

**Next Steps**: Begin with Phase 1 (Setup) to establish monorepo structure. Follow quickstart.md for detailed setup instructions.
