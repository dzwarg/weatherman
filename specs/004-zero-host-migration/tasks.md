# Tasks: 004-zero-host-migration

**Input**: Design documents from `specs/004-zero-host-migration/`
**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Tests**: Not requested - verification via existing test suite during Phase 5

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Netlify Configuration)

**Purpose**: Create Netlify configuration files and directory structure

- [x] T001 Create root `netlify.toml` with build, publish, and functions settings
- [x] T002 Create `packages/server/netlify/functions/` directory for Netlify Functions
- [x] T003 [P] Install `@netlify/cli` as dev dependency in server package
- [x] T004 [P] Configure Netlify site (connect GitHub repo, set build command, publish directory)
- [x] T005 [P] Configure Netlify site functions directory

**Note**: Single `netlify.toml` at repo root handles both frontend and backend. Publish path must be `packages/frontend/dist` (monorepo structure).

**Progress**: 5/5 Phase 1 tasks complete ✓

---

## Phase 2: Foundational (Backend Adaptation)

**Purpose**: Convert Express.js routes to Netlify Functions - blocks User Story 1

**⚠️ CRITICAL**: Complete before User Story 1 implementation

**Route mapping**: See plan.md Phase 2 Route Mapping table.

- [x] T007 Create `packages/server/netlify/functions/weather-current.js` wrapper for Express route
- [x] T008 [P] Create `packages/server/netlify/functions/weather-forecast.js` wrapper for Express route
- [x] T009 [P] Create `packages/server/netlify/functions/recommendations.js` wrapper for Express route
- [x] T010 [P] Create `packages/server/netlify/functions/health.js` wrapper for Express route
- [x] T011 Add CORS headers to all Netlify Functions for Netlify frontend domain
- [x] T012 Add error handling with proper status codes to all functions
- [x] T013 Verify functions work locally with `netlify dev`

**Checkpoint**: Backend adapted - Netlify Functions ready for deployment

---

## Phase 3: User Story 1 - Zero-Host Migration (Priority: P1) 🎯 MVP

**Goal**: Deploy frontend and backend to Netlify zero-host platform

**Independent Test**: All API endpoints return correct data on Netlify deployment

### Implementation

- [x] T014 [US1] Verify `netlify.toml` environment variable documentation in ./quickstart.md is accurate
- [x] T015 [US1] Add environment variables in Netlify dashboard:
  - `WEATHER_API_KEY` (was incorrectly documented as `OPENWEATHERMAP_API_KEY`)
  - `ANTHROPIC_API_KEY`
  - `FRONTEND_URL` (optional)
- [x] T016 [US1] Configure custom domain and HTTPS (optional)
- [x] T017 [US1] Update frontend API base URL to point to Netlify functions
- [x] T018 [US1] Test all API endpoints on Netlify deployment
- [x] T019 [US1] Verify PWA functionality (offline, install) on Netlify
- [x] T020 [US1] **REMOVED**: Netlify deploys on every git change automatically - no GitHub Actions workflow needed

**Checkpoint**: At this point, User Story 1 should be fully functional - MVP complete

---

## Phase 4: User Story 2 - CI/CD Integration (Priority: P2)

**Goal**: Implement automated deployment pipeline for zero-host environment

**Independent Test**: Deployment pipeline triggers on code push; rollback restores previous version

### Implementation

- [x] T021 [US2] Add `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` to GitHub repository secrets
- [x] T022 [US2] Configure branch deploys (preview URLs for PRs)
- [x] T023 [US2] Configure production deployment on push to main branch
- [x] T024 [US2] Document rollback procedure in quickstart.md
- [x] T025 [US2] Test deployment pipeline with a dummy commit

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verification and cleanup

- [x] T026 [P] Run existing test suite (`npm test`) and verify all tests pass
- [x] T027 [P] Verify lint passes (`npm run lint`) with no errors
- [x] T028 [P] Verify production build succeeds (`npm run build`)
- [ ] T029 Manual smoke test of all API endpoints on Netlify
- [ ] T030 Update quickstart.md with final deployment URLs and rollback instructions
- [ ] T031 Verify observability (Netlify analytics active and accessible)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies - can start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 - BLOCKS User Story 1
- **Phase 3 (User Story 1)**: Depends on Phase 2
- **Phase 4 (User Story 2)**: Can start after Phase 2, independent of Phase 3
- **Phase 5 (Polish)**: Depends on User Stories 1 and 2

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 complete - core migration
- **User Story 2 (P2)**: Can start after Phase 2 complete - CI/CD pipeline

### Within Each User Story

- Configuration before implementation
- Individual functions before integration
- Story complete before moving to polish phase

### Parallel Opportunities

- T007-T010: All Netlify function wrappers can be created in parallel
- T005-T006: Netlify site configuration can proceed in parallel
- T026-T028: All verification tasks can run in parallel

---

## Parallel Examples

### Backend Function Creation (Phase 2)

```bash
# These four functions can be created in parallel:
Task: "Create packages/server/netlify/functions/weather-current.js wrapper"
Task: "Create packages/server/netlify/functions/weather-forecast.js wrapper"
Task: "Create packages/server/netlify/functions/recommendations.js wrapper"
Task: "Create packages/server/netlify/functions/health.js wrapper"
```

### Verification Tasks (Phase 5)

```bash
# These three verification tasks can run in parallel:
Task: "Run npm test"
Task: "Run npm run lint"
Task: "Run npm run build"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add Phase 5 Polish → Final verification

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 29 |
| Phase 1 Tasks | 5 (5 complete ✓) |
| Phase 2 Tasks | 7 (7 complete ✓) |
| Phase 3 Tasks | 7 |
| Phase 4 Tasks | 5 |
| Phase 5 Tasks | 5 |
| **Completed** | **13** |

### Task Count by User Story

- **User Story 1 (P1)**: T014-T020 (7 tasks) - Core migration
- **User Story 2 (P2)**: T021-T025 (5 tasks) - CI/CD pipeline

### Suggested MVP Scope

**User Story 1 only** - Deploy to Netlify with manual verification. CI/CD can follow as User Story 2.

### Independent Test Criteria

- **User Story 1**: All 4 API endpoints return correct data on Netlify deployment
- **User Story 2**: PR triggers preview deployment; merge to main triggers production deployment

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Changelog

### 2026-04-03
- **T001-T004 complete**: Created Netlify configuration files and directory structure
  - Added root `netlify.toml` with build/publish/functions settings
  - Added `packages/server/netlify/functions/.gitkeep` placeholder
  - Added `@netlify/cli` as dev dependency in server package
  - Commit: `f43715f` (GPG-signed)
- **T004-T005 complete**: Configured Netlify site for frontend (connected GitHub repo, set build/publish directory)
  - Build command: `npm run build`
  - Publish directory: `packages/frontend/dist` (monorepo structure requires full path)
  - Functions directory: `packages/server/netlify/functions`
  - Commit: `b78eebb` (GPG-signed)
- **T007-T010 complete**: Created Netlify function wrappers for Express routes
  - `weather-current.js` - GET current weather (POST /api/weather/current)
  - `weather-forecast.js` - GET forecast (POST /api/weather/forecast)
  - `recommendations.js` - GET/POST recommendations (supports GET profiles, POST generate)
  - `health.js` - Health check endpoint (GET /api/health)
  - All functions include CORS headers and proper error handling
- **T011-T013 complete**: Added CORS headers, error handling, and verified with `netlify dev`
  - All functions use ES module exports (`export const handler`)
  - CORS headers configured for cross-origin requests
  - Error handling returns proper HTTP status codes (400, 405, 500)
  - Verified all functions work locally: health, recommendations, weather-current, weather-forecast
- **T019 complete**: Verified PWA functionality for Netlify deployment
  - VitePWA plugin configured with Workbox for service worker generation
  - Service worker (`sw.js`) generated in dist/ with precache for 16 assets
  - Offline.html exists for offline fallback
  - Runtime caching configured for API endpoints (NetworkFirst)
  - PWA manifest configured with icons (192x192, 512x512, maskable variants)
  - Build verified: `npm run build` generates sw.js and workbox files
  - Fixed: `OPENWEATHERMAP_API_KEY` → `WEATHER_API_KEY`
  - Added: `ANTHROPIC_API_KEY` (required for Claude integration)
  - Added: CLI authentication section with `NETLIFY_TOKEN`
  - Added: Frontend API configuration step (`VITE_API_BASE_URL`)
  - Clarified: Rate limits are hardcoded (not env-configurable)
- **T021-T025 complete**: CI/CD deployment pipeline via Netlify GitHub app
  - Netlify GitHub app auto-deploys on every push (no GitHub Actions needed)
  - Added deploy contexts in netlify.toml: production, deploy-preview, branch-deploy
  - Production: pushes to main branch deploy to production URL
  - Deploy Preview: PRs get unique preview URLs
  - Branch Deploy: any branch push gets unique deploy URL
  - Updated quickstart.md with deployment types and rollback instructions
- **T026-T028 complete**: Verification phase passed
  - All tests pass (315 passed, 6 skipped)
  - Lint passes with no errors
  - Production build succeeds (generates sw.js for PWA)
