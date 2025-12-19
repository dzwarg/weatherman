# Quick Start: Adding Express Server to Weatherman

This is a condensed quick-start guide. For comprehensive documentation, see `react-express-integration.md`.

## Prerequisites

- Node.js 22+
- Weatherman React PWA already set up
- Vite dev server running on port 5173

## 1. Install Dependencies

```bash
# In project root
npm install --save-dev concurrently

# For Express server
npm install express cors dotenv
```

## 2. Create Server Structure

```bash
mkdir -p server
touch server/index.js
```

## 3. Create Express Server

**server/index.js:**
```javascript
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Middleware
app.use(express.json());

if (isDevelopment) {
  app.use(cors({ origin: 'https://localhost:5173', credentials: true }));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production: Serve React static files
if (!isDevelopment) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'));
    }
  });
}

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
```

## 4. Update package.json

Add server scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "node server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\" --names \"React,Express\" --prefix-colors \"cyan,green\"",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## 5. Update vite.config.js

Add Express API proxy:

```javascript
export default defineConfig({
  server: {
    https: true,
    port: 5173,
    proxy: {
      // Add this BEFORE the existing /api/weather proxy
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      // Existing OpenWeatherMap proxy...
    }
  }
});
```

## 6. Create API Client

**src/services/apiClient.js:**
```javascript
class ApiClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  }

  async get(endpoint) {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }

  async post(endpoint, data) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error(`API error: ${response.statusText}`);
    return response.json();
  }
}

export default new ApiClient();
```

## 7. Create Environment Files

**.env.development:**
```bash
VITE_API_BASE_URL=/api

# Existing vars...
VITE_OPENWEATHER_API_KEY=your_key_here
```

**.env.production:**
```bash
VITE_API_BASE_URL=https://your-api.render.com/api

# Existing vars...
VITE_OPENWEATHER_API_KEY=your_production_key
```

## 8. Test It

```bash
# Start both servers
npm run dev:all

# Test API
# In browser: https://localhost:5173/api/health
# Or: curl https://localhost:5173/api/health
```

## 9. Usage in Components

```javascript
import apiClient from './services/apiClient';

// In your component
async function loadData() {
  try {
    const data = await apiClient.get('/health');
    console.log('API Response:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

## 10. Production Deployment

```bash
# Build frontend
npm run build

# Test production locally
NODE_ENV=production npm run dev:server

# Deploy:
# - Frontend: Vercel/Netlify (from /dist)
# - Backend: Render/Railway (server/index.js)
```

## Quick Reference

| Task | Command |
|------|---------|
| Start dev (both servers) | `npm run dev:all` |
| Start React only | `npm run dev` |
| Start Express only | `npm run dev:server` |
| Build for production | `npm run build` |
| Test production build | `NODE_ENV=production npm run dev:server` |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check (returns status) |
| `/api/users/profile` | GET | User profile (add as needed) |
| `/api/preferences` | POST | Save preferences (add as needed) |

## Troubleshooting

**Can't connect to Express:**
- Check Express is running: `curl http://localhost:3000/api/health`
- Check Vite proxy config in vite.config.js

**Environment variables not working:**
- Restart dev server after changing .env files
- Check variables start with `VITE_` prefix
- Verify: `console.log(import.meta.env.VITE_API_BASE_URL)`

**CORS errors:**
- Ensure proxy is configured correctly
- Check Express CORS middleware includes Vite dev server URL

## Next Steps

1. Add authentication endpoints
2. Add database (PostgreSQL, MongoDB, etc.)
3. Implement user preferences API
4. Add voice command logging
5. Set up production deployment

See `react-express-integration.md` for complete documentation.
