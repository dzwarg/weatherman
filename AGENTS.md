# AGENTS.md - Weatherman Codebase Guide

This file provides guidance for agentic coding agents working in this repository.

## Project Overview

**Weatherman** is a voice-activated PWA providing personalized outfit recommendations based on weather data for children ages 4-10. It's a monorepo with:

- `@weatherman/frontend` - React PWA (port 5173, HTTPS required)
- `@weatherman/server` - Express.js API (port 3000)

## Directory Structure

```
weatherman/
├── packages/
│   ├── frontend/
│   │   ├── src/
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── services/     # API clients, cache
│   │   │   ├── utils/        # Utility functions
│   │   │   ├── models/       # Data models
│   │   │   ├── pages/        # Page components
│   │   │   └── mocks/        # Mock data for dev
│   │   ├── tests/           # Test setup + unit tests
│   │   └── vite.config.js
│   └── server/
│       ├── src/
│       │   ├── controllers/  # Request handlers
│       │   ├── services/    # Business logic
│       │   ├── middleware/  # Express middleware
│       │   ├── routes/      # API routes
│       │   ├── validators/   # Input validation
│       │   └── config/      # Environment config
│       ├── tests/
│       │   ├── unit/
│       │   └── integration/
│       └── vitest.config.js
└── docs/                    # Documentation
```

---

## Build/Lint/Test Commands

### Root Commands (Monorepo)
```bash
npm run dev              # Start both frontend + server (concurrent)
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Lint all packages
npm run clean            # Remove node_modules, dist, coverage
```

### Frontend Commands
```bash
npm run dev              # Vite dev server (HTTPS, port 5173)
npm run build            # Production build to dist/
npm run test             # Vitest run with coverage
npm run test:watch       # Vitest watch mode
npm run test:coverage    # Vitest with coverage report
npm run test:e2e         # Playwright E2E tests
npm run test:e2e:ui       # Playwright UI mode
npm run lint             # ESLint with React plugins
npm run lint:fix         # Auto-fix linting issues
npm run lighthouse       # Lighthouse PWA audit
```

### Server Commands
```bash
npm run dev              # Node with --watch (port 3000)
npm run start            # Production start
npm run test             # Vitest run with coverage
npm run test:unit        # Unit tests only
npm run test:integration  # Integration tests only
npm run test:watch        # Vitest watch mode
npm run lint             # ESLint src/ directory
```

### Running Single Test Files
```bash
# Frontend - single test file
npx vitest run src/components/WeatherDisplay.test.jsx
npx vitest run src/hooks/useWeatherData.test.js

# Frontend - single test file in watch mode
npx vitest src/components/WeatherDisplay.test.jsx

# Server - single test file
npx vitest run tests/unit/weatherService.test.js
npx vitest run tests/integration/recommendations.test.js

# Server - specific test by name
npx vitest run -t "should return recommendations for cold weather"
```

---

## Code Style Guidelines

### General

- **Language**: JavaScript ES2022+ (ES Modules)
- **No TypeScript** - plain JavaScript with JSDoc optional
- **Formatting**: ESLint handles style; Prettier not explicitly configured
- **Prop-types**: Optional (enforced as warning only)

### Import Conventions

```javascript
// 1. Node built-ins
import fs from 'fs';
import path from 'path';

// 2. External packages
import express from 'express';
import { useState } from 'react';

// 3. Internal packages (workspace)
import { weatherService } from '@weatherman/server';

// 4. Relative imports (grouped by depth)
import Component from './Component.jsx';
import Hook from '../hooks/useHook.js';
import Service from '../../services/api.js';

// 5. Index/barrel files when available
import { Button, Card } from '../components/index.js';
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `weather-display.jsx`, `use-weather-data.js` |
| Components | PascalCase | `WeatherDisplay.jsx`, `VoiceInput.jsx` |
| Hooks | camelCase with `use` prefix | `useWeatherData.js`, `useSpeechRecognition.js` |
| Services | camelCase | `weatherService.js`, `cacheManager.js` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_RETRIES`, `API_TIMEOUT` |
| Variables | camelCase | `weatherData`, `isLoading` |
| Functions | camelCase (verbs for actions) | `getWeather()`, `handleSubmit()` |
| React props | camelCase | `onClick`, `userProfile` |
| CSS classes | kebab-case | `.weather-card`, `.voice-button` |

### React Component Patterns

```jsx
// Component file structure
import { useState, useEffect } from 'react';

export function WeatherCard({ temperature, condition, onRefresh }) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Cleanup logic here
    return () => {};
  }, []);

  const handleClick = () => {
    setIsExpanded(prev => !prev);
  };

  return (
    <div className="weather-card" onClick={handleClick}>
      <span>{temperature}°F</span>
      <span>{condition}</span>
    </div>
  );
}
```

### Error Handling

```javascript
// Server errors - return standardized JSON
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  },
  "timestamp": "ISO 8601 timestamp"
}

// Common error codes:
// - INVALID_REQUEST (400): Validation failure
// - RATE_LIMIT_EXCEEDED (429): Too many requests
// - WEATHER_API_ERROR (503): External API unavailable
// - WEATHER_API_TIMEOUT (503): API timeout (5s)

// Frontend error boundaries for React components
// Service errors handled in hooks, not components
```

### Testing Patterns

```javascript
// Frontend - React Testing Library
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeatherCard } from './WeatherCard.jsx';

describe('WeatherCard', () => {
  it('displays temperature', () => {
    render(<WeatherCard temperature={72} condition="Sunny" />);
    expect(screen.getByText('72°F')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<WeatherCard onRefresh={vi.fn()} />);
    await user.click(screen.getByRole('button'));
  });
});

// Server - Vitest with Supertest
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Weather API', () => {
  it('returns current weather', async () => {
    const res = await request(app)
      .post('/api/weather/current')
      .send({ lat: 40.7, lon: -74.0 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('temperature');
  });
});
```

### ESLint Rules Summary

| Rule | Setting | Notes |
|------|---------|-------|
| `no-console` | error | Allows `warn`, `error` only |
| `no-debugger` | error | - |
| `no-unused-vars` | error | Allow `_` prefix to ignore |
| `react/prop-types` | off | Optional in this codebase |
| `react-refresh/only-export-components` | warn | - |

### File Organization

- **Tests**: Co-located with source or in `tests/` directory
- **Config files**: In root of each package
- **Public assets**: `packages/frontend/public/`
- **Environment**: `.env` files, never committed with secrets

---

## Workflow Requirements

**All changes MUST follow** `docs/workflow.md`:

1. Sync with main branch
2. Create branch: `<spec-number>-<short-description>` (e.g., `001-weather-api-integration`)
3. Link to spec and task
4. Implement changes
5. Run quality checks (tests, lint, build)
6. Create **GPG-signed conventional commits**

### Commit Format
```
<type>(<scope>): <subject>

feat(weather): add wind speed display
fix(voice): resolve microphone permission error
test(outfit): add recommendation unit tests
chore(deps): update React to 18.3.0
```

### Task Status Rule

**Before creating any git commit, you MUST update the task status** in `specs/<spec-name>/tasks.md`:

1. Mark completed tasks with `[x]` in their checkbox
2. Update the "Progress" line for the phase if one exists
3. Update the "Completed" count in the Summary table
4. Add a changelog entry documenting what was done and the commit hash

This ensures the task board always reflects current progress.

### Version Bump Rule

**Every commit that changes source code, tests, or configuration MUST increment the version** in `packages/<package>/package.json` using `npm version <type>` (or manual edit). Use the appropriate semver bump:

- `patch` — bug fixes, test updates, refactors, docs
- `minor` — new features, non-breaking changes
- `major` — breaking API or behavior changes

For spec-based work, also update `specs/<spec-name>/tasks.md` to record the new version in the changelog.

Version must be bumped **before** committing, so the commit includes the version change alongside the code.

---

## Key Technical Details

### API Endpoints (Server)
- `POST /api/weather/current` - Get current weather (rate: 100/15min)
- `POST /api/weather/forecast` - Get forecast
- `POST /api/recommendations` - Get outfit recommendations (rate: 500/15min)
- `GET /api/health` - Health check

### PWA Requirements
- HTTPS required for Service Workers and microphone
- Vite dev server includes `basicSsl` plugin for local HTTPS
- Service Worker uses Network First, Cache Fallback strategy

### Voice Interface
- Uses Web Speech API (SpeechRecognition + SpeechSynthesis)
- Voice commands processed client-side
- No audio transmitted to server

---

## Useful References

- **Product Details**: `./docs/product-details.md`
- **Technical Architecture**: `./docs/technical-details.md`
- **Development Workflow**: `./docs/workflow.md`
- **Racine Design System**: https://seeds.sproutsocial.com/

## Active Technologies
- JavaScript ES2022+, Node.js 22+ + React 22+, Vite 5+, Express.js, Netlify CLI (004-zero-host-migration)
- Client-side only (localStorage/IndexedDB) - no server database (004-zero-host-migration)

## Node.js Version Requirements

- **Required**: Node.js 22+ (see `.nvmrc`)
- **Before running netlify commands**: Run `nvm use` to switch to the correct Node version
- Netlify CLI local version may warn about engine mismatches if not on Node 20+

## Recent Changes
- 004-zero-host-migration: Added JavaScript ES2022+, Node.js 22+ + React 22+, Vite 5+, Express.js, Netlify CLI
