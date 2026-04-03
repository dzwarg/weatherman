# Implementation Plan: 004-zero-host-migration

**Branch**: `004-zero-host-migration` | **Date**: 2026-04-03 | **Spec**: [spec.md](./spec.md)
**Input**: Migrate frontend and backend to zero-host cloud hosting provider

## Summary

Migrate the Weatherman PWA (React frontend + Express.js backend) to **Netlify** zero-host platform. Netlify provides static site hosting with unlimited bandwidth and serverless functions (125K calls/month free) compatible with Node.js/Express.js, requiring minimal code adaptation.

## Technical Context

**Language/Version**: JavaScript ES2022+, Node.js 22+
**Primary Dependencies**: React 22+, Vite 5+, Express.js, Netlify CLI
**Storage**: Client-side only (localStorage/IndexedDB) - no server database
**Testing**: Vitest + Testing Library (existing)
**Target Platform**: Netlify Cloud (CDN-backed global edge network)
**Project Type**: Monorepo (packages/frontend + packages/server)
**Performance Goals**: < 3s load, < 200ms API response, 99.9% uptime
**Constraints**: HTTPS required (PWA), service worker compatibility
**Scale/Scope**: Current single-instance → Netlify global distribution

## Constitution Check

| Gate | Status | Notes |
|------|--------|-------|
| Voice-First Interaction (I) | ✅ PASS | No voice changes; Netlify preserves Speech API |
| PWA Architecture (II) | ✅ PASS | Static hosting maintains Service Worker + manifest |
| Spec-Driven Development (III) | ✅ PASS | This spec and tasks document all changes |
| Quality-First (IV) | ✅ PASS | Tests, lint, build must pass post-migration |
| Privacy & Security (VII) | ✅ PASS | HTTPS enforced, no data flow changes |

**Note**: No constitutional violations anticipated. Netlify deployment preserves all existing architecture.

## Project Structure

### Documentation (this feature)

```text
specs/004-zero-host-migration/
├── plan.md              # This file
├── research.md          # Phase 0: Provider comparison
├── spec.md              # Feature specification
├── data-model.md        # Phase 1: (N/A - no data model changes)
├── quickstart.md        # Phase 1: Netlify deployment guide
└── contracts/           # Phase 1: (N/A - internal API only)
```

### Source Code (repository root)

```text
packages/
├── frontend/            # Static site → Netlify Pages
│   ├── src/
│   └── public/
└── server/              # Express API → Netlify Functions
    ├── src/
    │   └── functions/  # Netlify Functions (converted routes)
    └── netlify/        # Functions directory
```

**Structure Decision**: 
- Single `netlify.toml` at repo root handles both frontend and backend
- `packages/frontend` builds to `packages/frontend/dist` (monorepo structure)
- `packages/server` serves functions from `packages/server/netlify/functions`
- Build publishes to `packages/frontend/dist`

## Migration Phases

### Phase 1: Netlify Configuration

**Tasks**:
1. Create root `netlify.toml` with build, publish, and functions settings
2. Create server functions directory structure
3. Add Netlify build scripts to package.json
4. Configure environment variables in Netlify dashboard

**Files Created**:
- `netlify.toml` (root) - Single config for frontend + backend
- `packages/server/netlify/functions/` (functions directory)

### Phase 2: Backend Adaptation

**Tasks**:
1. Create Netlify function wrapper for Express routes
2. Convert each Express route to individual function files
3. Configure CORS for frontend domain
4. Set up function environment variables

**Route Mapping**:
| Express Route | Netlify Function |
|--------------|------------------|
| `/api/weather/current` | `netlify/functions/weather-current.js` |
| `/api/weather/forecast` | `netlify/functions/weather-forecast.js` |
| `/api/recommendations` | `netlify/functions/recommendations.js` |
| `/api/health` | `netlify/functions/health.js` |

### Phase 3: Frontend Deployment

**Tasks**:
1. Connect GitHub repo to Netlify
2. Configure build settings (Vite)
3. Set up deploy previews for PRs
4. Configure custom domain (optional)
5. Enable HTTPS

### Phase 4: CI/CD Pipeline

**Tasks**:
1. Configure GitHub Actions for Netlify deployment
2. Set up branch deploys (preview per PR)
3. Configure production deployment on merge to main
4. Add rollback capability via Netlify UI

### Phase 5: Verification

**Tasks**:
1. Run existing test suite (`npm test`)
2. Verify lint passes (`npm run lint`)
3. Verify build succeeds (`npm run build`)
4. Manual smoke test of all API endpoints
5. Verify PWA functionality (offline, install)

## Implementation Notes

### Netlify Functions vs Express Server

Netlify Functions are individual Lambda-like functions, not a running Express server. Key differences:
- No persistent state between requests
- Environment variables set in Netlify dashboard
- 10s default timeout (configurable)
- Node.js 22+ runtime

### Backend Adaptation Strategy

Convert Express middleware/routing to individual Netlify Functions:
```javascript
// netlify/functions/weather-current.js
const { handleWeatherCurrent } = require('../src/controllers/weatherController');

exports.handler = async (event, context) => {
  const result = await handleWeatherCurrent(JSON.parse(event.body));
  return {
    statusCode: 200,
    body: JSON.stringify(result)
  };
};
```

### Environment Variables

Required Netlify environment variables:
- `OPENWEATHERMAP_API_KEY` - Weather API key
- `RATE_LIMIT_WINDOW_MS` - Rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window

### Zero-Host Limits Validation

| Resource | Free Limit | Our Usage | Status |
|----------|-------------|-----------|--------|
| Bandwidth | 100GB/month | ~50MB/month | ✅ Safe |
| Function calls | 125K/month | ~5K/month | ✅ Safe |
| Build mins | 300/month | ~10/month | ✅ Safe |
| Sites | Unlimited | 2 | ✅ Safe |

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| Provider selection | **Netlify** - Node.js compatibility, generous free tier |
| Database architecture | No database - localStorage/IndexedDB only |
| Express adaptation | Convert routes to individual Netlify Functions |
| Observability | Netlify built-in analytics + function logs |
| Scope | Infrastructure only - no feature changes |

## Dependencies

### Development Dependencies
- `@netlify/cli` - Local development and deployment
- `netlify-dev` - Local function testing

### External Services
- Netlify (free account required)
- GitHub (already configured)

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Function cold starts | Netlify's edge network minimizes latency |
| API compatibility | Test all endpoints locally before deploy |
| Rate limit exceed | Monitor usage in Netlify dashboard |
| Build failures | Maintain local build verification in CI |

## Next Steps

1. **Execute Phase 1**: Create Netlify configuration files
2. **Execute Phase 2**: Adapt Express routes to Functions
3. **Execute Phase 3**: Deploy frontend to Netlify Pages
4. **Execute Phase 4**: Configure CI/CD
5. **Execute Phase 5**: Verify all tests pass

---

**Plan Status**: Ready for execution
**Generated**: 2026-04-03
