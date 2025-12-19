# Quickstart: Monorepo Server Setup

**Feature**: 002-monorepo-server \
**Target Audience**: Developers implementing this feature

## Overview

This guide provides step-by-step instructions for converting the Weatherman PWA into a monorepo with an Express server component.

**Estimated Time**: 2-3 hours for initial setup

---

## Prerequisites

- Node.js 22+ installed
- npm 7+ installed (comes with Node 22+)
- Git configured with GPG signing
- Existing Weatherman PWA codebase (spec 001 implemented)
- Weather API key (OpenWeatherMap or equivalent)

**Verify prerequisites:**
```bash
node --version  # Should be >= 22.0.0
npm --version   # Should be >= 7.0.0
git --version   # Confirm GPG signing configured
```

### Ollama Setup (Optional for Initial Development)

**Note**: Ollama is optional for initial frontend development. The frontend will use mocked responses by default. Set up Ollama when you're ready to integrate the real LLM service.

**Install Ollama:**
```bash
# macOS/Linux
curl -fsSL https://ollama.com/install.sh | sh

# Or download from https://ollama.com/download
# Windows: Download installer from ollama.com
```

**Pull recommended model:**
```bash
ollama pull mistral:latest
# This downloads ~4GB, may take a few minutes

# Alternative for low-resource systems:
# ollama pull phi:latest  # Only 1.6GB, faster but lower quality
```

**Start Ollama service:**
```bash
ollama serve
# Runs on http://localhost:11434 by default
# Keep this terminal open while developing
```

**Verify Ollama is running:**
```bash
curl http://localhost:11434/api/tags
# Should return JSON with list of available models
```

**Test recommendation generation:**
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "mistral:latest",
  "prompt": "Suggest clothing for a 4-year-old in cold weather",
  "stream": false
}'
# Should return JSON with clothing suggestions
```

**If Ollama setup fails:**
- Frontend will use mocks (`VITE_USE_MOCK_OLLAMA=true`)
- Server will fallback to rule-based recommendations
- You can complete frontend development without Ollama
- Ollama integration tests will be skipped

---

## Phase 1: Monorepo Structure Setup

### Step 1: Create Backup

```bash
# Create safety backup branch
git checkout -b backup-pre-monorepo
git push origin backup-pre-monorepo

# Return to feature branch
git checkout 002-monorepo-server
```

### Step 2: Create Package Directories

```bash
# Create packages structure
mkdir -p packages/frontend packages/server/src
```

### Step 3: Move Existing Frontend Code

```bash
# Move frontend files to packages/frontend/ using git mv
git mv src packages/frontend/
git mv public packages/frontend/
git mv index.html packages/frontend/
git mv vite.config.js packages/frontend/
git mv vitest.config.js packages/frontend/
git mv eslint.config.js packages/frontend/
git mv tests packages/frontend/
git mv scripts packages/frontend/

# These stay at root:
# - docs/
# - specs/
# - .env, .env.example
# - .gitignore
# - README.md
# - CLAUDE.md
# - CONTRIBUTING.md
# - .specify/, .claude/
```

### Step 4: Create Frontend Package Config

```bash
# Copy current package.json to frontend
cp package.json packages/frontend/package.json
```

Edit `packages/frontend/package.json`:
- Change `"name"` to `"@weatherman/frontend"`
- Keep all existing dependencies and devDependencies
- Keep all existing scripts
- Remove `"yarn"` from `engines` (npm only in monorepo)

### Step 5: Create Server Package

Create `packages/server/package.json`:
```json
{
  "name": "@weatherman/server",
  "version": "0.1.0",
  "description": "Weatherman API Server",
  "type": "module",
  "private": true,
  "main": "src/server.js",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint src --ext js --max-warnings 0"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.0",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.1",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "vitest": "^2.1.5",
    "supertest": "^6.3.4",
    "eslint": "^9.15.0"
  }
}
```

### Step 6: Create Basic Server

Create `packages/server/src/server.js`:
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from 'dotenv';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

// Placeholder routes
app.post('/api/weather/current', (req, res) => {
  res.json({ message: 'Weather API endpoint - to be implemented' });
});

app.post('/api/recommendations', (req, res) => {
  res.json({ message: 'Recommendations endpoint - to be implemented' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
});

export default app;
```

### Step 7: Update Root Package JSON

Replace root `package.json` with workspace configuration:
```json
{
  "name": "weatherman",
  "version": "0.1.0",
  "description": "Voice-activated weather clothing advisor PWA for children ages 4-10",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:server\" --names \"React,Express\" --prefix-colors \"cyan,green\"",
    "dev:frontend": "npm run dev --workspace=@weatherman/frontend",
    "dev:server": "npm run dev --workspace=@weatherman/server",
    "build": "npm run build --workspaces --if-present",
    "build:frontend": "npm run build --workspace=@weatherman/frontend",
    "build:server": "npm run build --workspace=@weatherman/server",
    "test": "npm run test --workspaces --if-present",
    "test:frontend": "npm run test --workspace=@weatherman/frontend",
    "test:server": "npm run test --workspace=@weatherman/server",
    "lint": "npm run lint --workspaces --if-present",
    "clean": "rm -rf node_modules packages/*/node_modules packages/*/dist"
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

### Step 8: Clean Install

```bash
# Remove all existing node_modules
rm -rf node_modules packages/*/node_modules

# Remove package-lock.json (will be regenerated)
rm package-lock.json

# Install all workspace dependencies
npm install
```

**Verify installation:**
```bash
# Check workspaces are linked
npm ls --workspaces

# Verify symlinks exist
ls -la node_modules/@weatherman/
```

### Step 9: Update Frontend Vite Config

Edit `packages/frontend/vite.config.js`, add proxy configuration:

```javascript
export default defineConfig({
  // ... existing config ...
  server: {
    https: true,
    port: 5173,
    proxy: {
      // NEW: Proxy API requests to Express server
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

### Step 10: Create Environment Files

Create `packages/server/.env.example`:
```bash
# Weather API Configuration
WEATHER_API_KEY=your_api_key_here
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5

# Ollama Configuration (optional)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
OLLAMA_TIMEOUT=10000

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=https://localhost:5173,http://localhost:5173
```

Create `packages/server/.env`:
```bash
# Copy from .env.example and add real API key
WEATHER_API_KEY=<your_actual_api_key>
WEATHER_API_BASE_URL=https://api.openweathermap.org/data/2.5

# Ollama Configuration (optional - defaults shown)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=mistral:latest
OLLAMA_TIMEOUT=10000

PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=https://localhost:5173,http://localhost:5173
```

Create `packages/frontend/.env.development`:
```bash
# Use mocked Ollama responses during frontend development
VITE_USE_MOCK_OLLAMA=true

# Server API base URL (proxied by Vite in development)
VITE_API_BASE_URL=/api
```

Create `packages/frontend/.env.production`:
```bash
# Use real Ollama service in production
VITE_USE_MOCK_OLLAMA=false

# Server API base URL for production
VITE_API_BASE_URL=https://api.weatherman.app/api
```

**Add to .gitignore:**
```bash
echo "packages/server/.env" >> .gitignore
```

---

## Phase 2: Test the Setup

### Test 1: Frontend Runs Independently

```bash
npm run dev:frontend
```

Expected:
- Vite starts on https://localhost:5173
- App loads without errors
- Console shows no proxy errors (server not needed yet)

### Test 2: Server Runs Independently

```bash
# In new terminal
npm run dev:server
```

Expected:
- Server starts on http://localhost:3000
- Console shows: "✓ Server running on http://localhost:3000"

Test health endpoint:
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### Test 3: Both Together

```bash
npm run dev
```

Expected:
- Both servers start simultaneously
- Colored output shows "React" and "Express" logs
- Frontend: https://localhost:5173
- Backend: http://localhost:3000

### Test 4: Proxy Works

With both servers running, test proxy from browser:
```bash
# Open browser DevTools Network tab
# Navigate to: https://localhost:5173
# In console, run:
fetch('/api/health').then(r => r.json()).then(console.log)
```

Expected:
- Network tab shows request to `/api/health` (not full URL)
- Response: `{status: "ok", timestamp: "..."}`
- No CORS errors

### Test 5: Tests Still Work

```bash
npm run test
```

Expected:
- Frontend tests pass
- Server tests pass (even if placeholder)

### Test 6: Build Works

```bash
npm run build
```

Expected:
- Frontend builds to `packages/frontend/dist/`
- Server has no build step (Node.js runs source directly)
- No errors

---

## Phase 3: Commit the Setup

### Verify Changes

```bash
git status
```

Should show:
- Modified: package.json, .gitignore
- Added: packages/frontend/, packages/server/
- Deleted: src/, public/, etc. (moved to packages/frontend/)

### Commit

```bash
git add .

git commit -m "feat(monorepo): setup npm workspaces structure

- Created packages/frontend with existing React PWA code
- Created packages/server with basic Express skeleton
- Configured npm workspaces in root package.json
- Added concurrently for running both packages
- Updated Vite config with API proxy to avoid CORS
- Added server .env configuration

Refs: 002-monorepo-server"
```

---

## Phase 4: Implement Server Endpoints

Now that the structure is set up, implement the actual server functionality:

### Checklist

- [ ] Create weather proxy service (`packages/server/src/services/weatherProxyService.js`)
- [ ] Create recommendation service (`packages/server/src/services/recommendationService.js`)
- [ ] Move clothing rules from frontend to server (`packages/server/src/utils/clothingRules.js`)
- [ ] Implement weather routes (`packages/server/src/routes/weather.js`)
- [ ] Implement recommendation routes (`packages/server/src/routes/recommendations.js`)
- [ ] Add request validation (`packages/server/src/validators/`)
- [ ] Add rate limiting middleware (`packages/server/src/middleware/rateLimiter.js`)
- [ ] Add error handling middleware (`packages/server/src/middleware/errorHandler.js`)
- [ ] Write integration tests for all endpoints
- [ ] Update frontend services to call server APIs
- [ ] Remove hardcoded recommendation logic from frontend
- [ ] Update Service Worker to cache server responses
- [ ] Test offline functionality
- [ ] Document API endpoints

**Detailed implementation tasks:** See `tasks.md` (generated by `/speckit.tasks`)

---

## Troubleshooting

### Issue: "Cannot find module @weatherman/frontend"

**Cause**: Workspaces not properly installed

**Solution**:
```bash
npm run clean
npm install
```

### Issue: Vite HMR not working

**Cause**: Vite can't watch files in workspace packages

**Solution**: Add to `packages/frontend/vite.config.js`:
```javascript
server: {
  fs: {
    allow: ['..', '../../node_modules']
  }
}
```

### Issue: CORS errors even with proxy

**Cause**: Requests not going through proxy

**Solution**: Ensure API calls use relative paths (`/api/weather` not `http://localhost:3000/api/weather`)

### Issue: Server env vars not loading

**Cause**: `.env` file in wrong location or not loaded

**Solution**:
1. Verify `.env` is in `packages/server/`
2. Check `dotenv` is imported in `server.js`
3. Run: `node -e "require('dotenv').config({path:'./packages/server/.env'}); console.log(process.env.WEATHER_API_KEY)"`

### Issue: Tests failing after migration

**Cause**: Test setup files have wrong paths

**Solution**: Update test setup to use correct paths relative to `packages/frontend/`

### Issue: Git doesn't detect moved files

**Cause**: Used `mv` instead of `git mv`

**Solution**: Use `git mv` for moving files to preserve history

---

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Run both frontend and server
npm run dev:frontend     # Run only frontend
npm run dev:server       # Run only server

# Testing
npm run test             # Test all packages
npm run test:frontend    # Test only frontend
npm run test:server      # Test only server

# Building
npm run build            # Build all packages
npm run build:frontend   # Build only frontend

# Linting
npm run lint             # Lint all packages

# Dependencies
npm install <pkg> --workspace=@weatherman/frontend   # Add to frontend
npm install <pkg> --workspace=@weatherman/server     # Add to server
npm install <pkg> -D                                 # Add to root (shared)

# Cleaning
npm run clean            # Remove all node_modules and dist folders
```

### Directory Structure

```
weatherman/
├── package.json                          # Root workspace config
├── packages/
│   ├── frontend/                         # React PWA
│   │   ├── package.json
│   │   ├── vite.config.js (with proxy)
│   │   ├── src/
│   │   ├── public/
│   │   └── tests/
│   └── server/                           # Express API
│       ├── package.json
│       ├── .env (not committed)
│       ├── .env.example (committed)
│       ├── src/
│       │   ├── server.js
│       │   ├── routes/
│       │   ├── services/
│       │   └── middleware/
│       └── tests/
├── docs/                                 # Documentation (root)
├── specs/                                # Feature specs (root)
└── node_modules/                         # Shared dependencies
```

### Port Reference

| Component | Port | Protocol | Purpose |
|-----------|------|----------|---------|
| React Dev Server | 5173 | HTTPS | Frontend development |
| Express Server | 3000 | HTTP | Backend API |
| Vite Proxy | N/A | N/A | Forwards `/api/*` → `http://localhost:3000` |

---

## Next Steps

1. **Implement Server Endpoints**: Follow tasks in `tasks.md`
2. **Update Frontend Services**: Modify `weatherService.js` and `recommendationService.js` to call server
3. **Move Recommendation Logic**: Transfer `clothingRules.js` to server package
4. **Test Integration**: Verify full workflow (voice → frontend → server → response)
5. **Update Documentation**: Reflect monorepo structure in README and docs

---

## Additional Resources

- **Full Planning Document**: [plan.md](./plan.md)
- **Research Findings**: [research.md](./research.md)
- **Data Model**: [data-model.md](./data-model.md)
- **API Contracts**: [contracts/](./contracts/)
- **Implementation Tasks**: [tasks.md](./tasks.md) (after running `/speckit.tasks`)

---

**Last Updated**: 2025-12-19
