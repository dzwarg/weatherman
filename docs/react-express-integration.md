# React PWA + Express Server Integration Guide

## Overview

This document outlines best practices for integrating the Weatherman React PWA (Vite-based) with a local Express server for both development and production environments. This architecture maintains offline PWA capabilities while enabling server-side API functionality.

## Architecture Summary

**Development Environment:**
- React PWA: Vite dev server on port 5173 (HTTPS)
- Express API: Local server on port 3000
- Communication: Vite proxy forwards `/api/*` requests to Express server

**Production Environment:**
- React PWA: Static build deployed to CDN or static hosting
- Express API: Deployed separately (Render, Railway, Vercel, etc.)
- Communication: Frontend makes direct API calls using environment-configured base URL

---

## Decision: Recommended Integration Approach

### Development Strategy
Use **Vite's built-in proxy** to forward API requests from the React dev server to the Express backend, avoiding CORS issues entirely during development.

### Production Strategy
Use **environment variables** to configure the API base URL, allowing the static React build to communicate with the deployed Express server. Implement **Network-First caching** in the Service Worker for API responses to maintain offline capabilities with fresh data prioritization.

---

## Rationale

### Why Vite Proxy for Development?
1. **Eliminates CORS Issues**: Browser sees all requests as same-origin
2. **No Server-Side CORS Configuration**: Express doesn't need CORS middleware for development
3. **Cleaner Code**: No need to hardcode full URLs (use relative paths like `/api/users`)
4. **Production-Ready**: Proxy only runs in development; production uses real API URLs

### Why Environment Variables for Production?
1. **Flexibility**: Different API URLs for staging, production, etc.
2. **Security**: No hardcoded URLs in source code
3. **Standard Practice**: Vite's built-in support with `VITE_*` prefix
4. **Type Safety**: Variables validated at build time

### Why Network-First Caching for API?
1. **Data Freshness**: Always attempts to fetch latest data from server
2. **Offline Fallback**: Gracefully falls back to cached data when offline
3. **Perfect for Weather Data**: Balances need for current data with offline capability
4. **Workbox Integration**: Already configured in your `vite.config.js`

---

## Configuration Examples

### 1. Vite Proxy Setup

Your current `/Users/mm39178/repos/weatherman/vite.config.js` already has a proxy configured for OpenWeatherMap. Here's how to add Express server proxy:

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      // ... existing PWA config
    })
  ],
  server: {
    https: true,
    port: 5173,
    proxy: {
      // Existing OpenWeatherMap proxy
      '/api/weather': {
        target: 'https://api.openweathermap.org/data/3.0',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weather/, ''),
        secure: false
      },
      // New Express server proxy
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

**How it works:**
- Request to `http://localhost:5173/api/users` → Proxied to `http://localhost:3000/api/users`
- Request to `http://localhost:5173/api/weather/...` → Proxied to OpenWeatherMap (more specific match)
- Order matters: More specific routes first

### 2. Environment Variables

Create environment-specific files in your project root:

**.env.development**
```bash
# Development - use proxy (relative URLs)
VITE_API_BASE_URL=/api

# Or point directly to Express server
# VITE_API_BASE_URL=http://localhost:3000/api

# OpenWeatherMap (existing)
VITE_OPENWEATHER_API_KEY=your_api_key_here
VITE_OPENWEATHER_TIMEOUT=5000
VITE_WEATHER_CACHE_DURATION=3600000
```

**.env.production**
```bash
# Production - deployed Express server
VITE_API_BASE_URL=https://your-api.render.com/api

# OpenWeatherMap (existing)
VITE_OPENWEATHER_API_KEY=your_production_api_key_here
VITE_OPENWEATHER_TIMEOUT=5000
VITE_WEATHER_CACHE_DURATION=3600000
```

**.env.local** (git-ignored, for local secrets)
```bash
# Override for local development if needed
VITE_API_BASE_URL=http://localhost:3000/api
```

### 3. API Client Setup

Create a centralized API client that uses environment variables:

**src/services/apiClient.js**
```javascript
/**
 * API Client
 * Centralized HTTP client for Express server API calls
 */

class ApiClient {
  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
    this.timeout = 5000; // 5 seconds
  }

  /**
   * Make authenticated API call with timeout
   * @param {string} endpoint - API endpoint (e.g., '/users')
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(
          `API error: ${response.statusText}`,
          response.status,
          await response.json().catch(() => ({}))
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408, { timeout: this.timeout });
      }

      if (error instanceof ApiError) {
        throw error;
      }

      // Network error (offline, DNS failure, etc.)
      throw new ApiError('Network error', 0, { originalError: error.message });
    }
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Custom error class for API failures
 */
export class ApiError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }

  get isNetworkError() {
    return this.statusCode === 0;
  }

  get isTimeout() {
    return this.statusCode === 408;
  }

  get isServerError() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  get isClientError() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
}

export default new ApiClient();
```

**Usage Example:**
```javascript
// In a component or service
import apiClient, { ApiError } from './services/apiClient';

async function fetchUserProfile() {
  try {
    const profile = await apiClient.get('/users/profile');
    return profile;
  } catch (error) {
    if (error.isNetworkError) {
      console.error('Network error - user may be offline');
      // Return cached data or show offline message
    } else if (error.isTimeout) {
      console.error('Request timeout');
    } else if (error.isServerError) {
      console.error('Server error:', error.statusCode);
    }
    throw error;
  }
}
```

---

## Development Workflow

### Setup Steps

1. **Install Concurrently** (for running both servers simultaneously):
```bash
npm install --save-dev concurrently
```

2. **Update package.json scripts**:
```json
{
  "scripts": {
    "dev": "vite",
    "dev:server": "node server/index.js",
    "dev:all": "concurrently \"npm run dev\" \"npm run dev:server\" --names \"React,Express\" --prefix-colors \"cyan,green\"",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "eslint . --ext js,jsx --fix"
  }
}
```

3. **Create Express Server Structure**:
```bash
mkdir -p server
touch server/index.js
touch server/package.json  # Optional: separate dependencies
```

### Basic Express Server Setup

**server/index.js**
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

// CORS: Only needed if NOT using Vite proxy in development
if (isDevelopment) {
  app.use(cors({
    origin: 'https://localhost:5173', // Vite dev server
    credentials: true
  }));
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/users/profile', (req, res) => {
  // Example endpoint
  res.json({
    name: 'Test User',
    preferences: {
      temperature: 'fahrenheit',
      voice: 'enabled'
    }
  });
});

// Production: Serve React static files
if (!isDevelopment) {
  const buildPath = path.join(__dirname, '../dist');
  app.use(express.static(buildPath));

  // Serve index.html for all non-API routes (React Router)
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log(`Environment: ${isDevelopment ? 'development' : 'production'}`);
});
```

### Running Both Servers

**Development:**
```bash
# Start both React and Express servers
npm run dev:all

# Or manually in separate terminals:
# Terminal 1: npm run dev
# Terminal 2: npm run dev:server
```

**Testing:**
```bash
# React app: https://localhost:5173
# Express API: http://localhost:3000
# API via proxy: https://localhost:5173/api/health
```

---

## Service Worker Caching Strategy

### Network-First for API Responses

Your current `/Users/mm39178/repos/weatherman/vite.config.js` already implements Network-First caching for the OpenWeatherMap API. Extend this for your Express API:

```javascript
// vite.config.js - workbox configuration
workbox: {
  globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
  navigateFallback: null,
  navigateFallbackDenylist: [/^\/api/],
  runtimeCaching: [
    // Existing: OpenWeatherMap
    {
      urlPattern: /^https:\/\/api\.openweathermap\.org\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'weather-api-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 3600 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // New: Local Express API (Production)
    {
      urlPattern: ({ url }) => {
        // Match production API domain
        const apiDomain = import.meta.env.VITE_API_BASE_URL;
        return url.href.includes('/api/') && url.pathname.startsWith('/api/');
      },
      handler: 'NetworkFirst',
      options: {
        cacheName: 'express-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 3600 // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200]
        },
        networkTimeoutSeconds: 5
      }
    },
    // Static pages (Cache-First)
    {
      urlPattern: ({ request }) => request.mode === 'navigate',
      handler: 'CacheFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 86400 // 24 hours
        }
      }
    }
  ]
}
```

### Caching Strategy Breakdown

| Resource Type | Strategy | Cache Duration | Rationale |
|--------------|----------|----------------|-----------|
| API Responses (GET) | Network-First | 1 hour | Fresh data priority, offline fallback |
| Static Assets (JS/CSS) | Cache-First | 30 days | Immutable with hash in filename |
| HTML Pages | Cache-First | 24 hours | App shell caching |
| Images/Icons | Cache-First | 7 days | Static assets, rarely change |

### Important Notes on POST Requests

The Service Worker Cache API is designed primarily for GET requests. For POST/PUT/DELETE requests:

1. **Don't cache POST requests** - Use Workbox Background Sync instead
2. **Background Sync**: Queue failed POST requests and retry when online
3. **Implementation**:

```javascript
// For POST requests that need offline support
import { BackgroundSyncPlugin } from 'workbox-background-sync';

const bgSyncPlugin = new BackgroundSyncPlugin('apiQueue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours
});

// Register route for POST requests
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);
```

---

## Fallback Handling: Server Unavailable Scenarios

### Detection Strategy

Create a service to monitor API availability:

**src/services/apiHealthCheck.js**
```javascript
/**
 * API Health Check Service
 * Monitors API availability and handles offline scenarios
 */

import apiClient, { ApiError } from './apiClient';

class ApiHealthCheck {
  constructor() {
    this.isOnline = navigator.onLine;
    this.apiAvailable = true;
    this.lastCheck = null;
    this.checkInterval = 30000; // 30 seconds
    this.listeners = new Set();

    this.setupListeners();
  }

  setupListeners() {
    // Browser online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.checkApiHealth();
      this.notifyListeners();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.apiAvailable = false;
      this.notifyListeners();
    });

    // Periodic health checks
    setInterval(() => {
      if (this.isOnline) {
        this.checkApiHealth();
      }
    }, this.checkInterval);
  }

  async checkApiHealth() {
    try {
      await apiClient.get('/health');
      this.apiAvailable = true;
      this.lastCheck = new Date();
      this.notifyListeners();
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.isNetworkError) {
        this.apiAvailable = false;
        this.notifyListeners();
      }
      return false;
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    const status = {
      isOnline: this.isOnline,
      apiAvailable: this.apiAvailable,
      lastCheck: this.lastCheck
    };
    this.listeners.forEach(callback => callback(status));
  }

  getStatus() {
    return {
      isOnline: this.isOnline,
      apiAvailable: this.apiAvailable,
      lastCheck: this.lastCheck
    };
  }
}

export default new ApiHealthCheck();
```

### React Hook for Components

**src/hooks/useApiStatus.js**
```javascript
/**
 * React Hook: useApiStatus
 * Monitor API availability in components
 */

import { useState, useEffect } from 'react';
import apiHealthCheck from '../services/apiHealthCheck';

export function useApiStatus() {
  const [status, setStatus] = useState(apiHealthCheck.getStatus());

  useEffect(() => {
    const unsubscribe = apiHealthCheck.subscribe(setStatus);
    return unsubscribe;
  }, []);

  return status;
}
```

### UI Components for Offline State

**src/components/OfflineIndicator.jsx**
```javascript
/**
 * Offline Indicator Component
 * Shows banner when API is unavailable
 */

import React from 'react';
import { useApiStatus } from '../hooks/useApiStatus';
import './OfflineIndicator.css';

export function OfflineIndicator() {
  const { isOnline, apiAvailable } = useApiStatus();

  if (isOnline && apiAvailable) {
    return null; // Everything is working
  }

  return (
    <div className="offline-indicator" role="alert" aria-live="polite">
      <div className="offline-indicator-content">
        {!isOnline && (
          <>
            <span className="offline-icon">📡</span>
            <span className="offline-text">No internet connection</span>
          </>
        )}
        {isOnline && !apiAvailable && (
          <>
            <span className="offline-icon">⚠️</span>
            <span className="offline-text">Server unavailable - Using cached data</span>
          </>
        )}
      </div>
    </div>
  );
}
```

### Graceful Degradation Examples

**1. Loading Cached Data:**
```javascript
async function getWeatherWithFallback(location) {
  const { apiAvailable } = apiHealthCheck.getStatus();

  try {
    // Always try fresh data first
    return await weatherService.getCurrentWeather(location);
  } catch (error) {
    console.warn('Fresh data unavailable, using cache');

    // Try cached data
    const cached = await cacheService.get(location.lat, location.lon);
    if (cached) {
      return {
        ...cached,
        _isStale: true,
        _staleReason: apiAvailable ? 'API error' : 'Offline'
      };
    }

    // No cache available
    throw new Error('No data available offline');
  }
}
```

**2. Disabling Features:**
```javascript
function VoiceCommandButton() {
  const { apiAvailable } = useApiStatus();

  return (
    <button
      disabled={!apiAvailable}
      title={!apiAvailable ? 'Voice commands require server connection' : 'Start voice command'}
    >
      {apiAvailable ? '🎤 Voice Command' : '🎤 Voice Command (Offline)'}
    </button>
  );
}
```

**3. Queue Actions for Later:**
```javascript
async function saveUserPreference(preference) {
  const { apiAvailable } = apiHealthCheck.getStatus();

  if (!apiAvailable) {
    // Queue for background sync
    await queueForSync('preferences', preference);
    showNotification('Preference saved locally. Will sync when online.');
    return;
  }

  // Save immediately
  await apiClient.post('/users/preferences', preference);
}
```

---

## Production Build Considerations

### Build Process

1. **Build React App:**
```bash
npm run build
# Outputs to /dist directory
```

2. **Test Production Build Locally:**
```bash
npm run preview
# Vite preview server on port 4173
```

3. **Test with Express:**
```bash
NODE_ENV=production npm run dev:server
# Express serves from /dist
```

### Deployment Options

#### Option 1: Separate Deployments (Recommended)

**Frontend (React PWA):**
- Deploy to: Vercel, Netlify, Cloudflare Pages, Firebase Hosting
- Why: Optimized for static assets, automatic HTTPS, global CDN
- Configuration: Set `VITE_API_BASE_URL` to production Express URL

**Backend (Express API):**
- Deploy to: Render, Railway, Fly.io, Heroku, AWS ECS
- Why: Node.js runtime support, easy environment variables, auto-scaling
- Configuration: Set CORS to allow frontend domain

#### Option 2: Monorepo Deployment

**Single server hosting both:**
- Express serves API routes (`/api/*`)
- Express serves React static files for all other routes
- Deploy to: Render, Railway, Fly.io
- Pros: Simpler deployment, single domain
- Cons: Less scalable, frontend not on CDN

### Environment Variable Checklist

**Frontend (.env.production):**
```bash
VITE_API_BASE_URL=https://your-api.onrender.com/api
VITE_OPENWEATHER_API_KEY=your_production_key
VITE_OPENWEATHER_TIMEOUT=5000
```

**Backend (Express):**
```bash
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://weatherman-app.netlify.app
OPENWEATHER_API_KEY=your_production_key  # If proxying weather API
```

### HTTPS Requirements

PWA features require HTTPS in production:
- Service Workers
- Geolocation API
- Microphone access (Web Speech API)

**Solutions:**
- All recommended platforms provide free HTTPS
- For custom servers: Use Let's Encrypt (Certbot)

### Deployment Testing Checklist

- [ ] Service Worker registers successfully
- [ ] PWA installable on mobile devices
- [ ] Offline functionality works (cached data available)
- [ ] API calls use correct production URL
- [ ] Voice recognition works (HTTPS + microphone permissions)
- [ ] Geolocation works (HTTPS + location permissions)
- [ ] Lighthouse PWA score > 95
- [ ] All environment variables loaded correctly
- [ ] CORS configured correctly (if separate deployments)
- [ ] Console shows no errors

---

## Summary: Key Decisions

| Aspect | Development | Production |
|--------|-------------|------------|
| **Communication** | Vite proxy (`/api` → `http://localhost:3000`) | Direct API calls to deployed server |
| **API Base URL** | `/api` (relative, via proxy) | `https://api.example.com/api` (env var) |
| **CORS** | Not needed (proxy handles it) | Required on Express server |
| **Caching Strategy** | Network-First (test with devOptions) | Network-First (production SW) |
| **Running Servers** | Concurrently (both at once) | Separate deployments |
| **Offline Handling** | Show indicators, use cached data | Show indicators, use cached data |
| **HTTPS** | Required (Vite basicSsl plugin) | Required (hosting platform) |

---

## References

### Documentation
- [Vite Environment Variables](https://vite.dev/guide/env-and-mode) - Official Vite env vars guide
- [Vite Proxy Configuration](https://vite.dev/config/server-options#server-proxy) - Proxy setup documentation
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/guide/) - PWA plugin guide
- [Workbox Caching Strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview) - Service worker strategies

### Tutorials
- [Solving CORS with Vite Proxy Configuration](https://en.kelen.cc/posts/solving-cors-with-vite-proxy-configuration) - CORS and proxy setup
- [Running React and Express Concurrently](https://blog.logrocket.com/running-react-express-concurrently/) - Development workflow
- [Service Worker Caching Strategies](https://nbellocam.dev/blog/caching-strategies) - Network-First implementation
- [Progressive Web App Development](https://www.blog.brightcoding.dev/2025/12/03/%F0%9F%9A%80-the-ultimate-guide-to-transforming-vite-apps-into-lightning-fast-pwas-with-vite-plugin-pwa/) - PWA best practices

### Tools
- [concurrently](https://www.npmjs.com/package/concurrently) - Run multiple npm commands simultaneously
- [Workbox](https://web.dev/learn/pwa/workbox) - Service worker libraries and strategies

---

## Next Steps

1. **Create Express Server**: Set up basic Express API in `/server` directory
2. **Configure Proxy**: Update `vite.config.js` with Express API proxy
3. **Set Environment Variables**: Create `.env.development` and `.env.production`
4. **Create API Client**: Implement centralized API client with error handling
5. **Test Development Workflow**: Run both servers with `npm run dev:all`
6. **Implement Health Checks**: Add API availability monitoring
7. **Update Service Worker**: Configure caching for Express API endpoints
8. **Build & Test Production**: Create production build and test deployment
9. **Deploy**: Deploy frontend and backend to chosen platforms
10. **Validate PWA**: Test Lighthouse score and offline functionality

---

## Troubleshooting

### Common Issues

**Issue: Proxy not working in development**
- Check Vite dev server is running on HTTPS
- Verify proxy target URL is correct
- Check Express server is running
- Test proxy endpoint directly: `curl http://localhost:3000/api/health`

**Issue: Environment variables not loading**
- Ensure variables start with `VITE_` prefix
- Restart dev server after changing `.env` files
- Check `import.meta.env.VITE_API_BASE_URL` value in console

**Issue: Service Worker not caching API**
- Check urlPattern matches your API endpoints
- Verify network requests in DevTools → Network tab
- Check Service Worker cache in DevTools → Application → Cache Storage

**Issue: CORS errors in production**
- Configure Express CORS to allow frontend domain
- Ensure credentials are handled correctly if using cookies
- Check browser console for specific CORS error message

**Issue: PWA not installable**
- Ensure HTTPS in production
- Verify manifest.json is accessible
- Check Lighthouse PWA audit for specific issues
- Test on actual mobile device (not just desktop Chrome)

---

## Conclusion

This integration approach provides:
- **Development Efficiency**: Vite proxy eliminates CORS headaches
- **Production Flexibility**: Environment variables enable multiple deployment strategies
- **Offline Capability**: Network-First caching maintains PWA functionality
- **Graceful Degradation**: Health checks and fallbacks ensure good UX when offline
- **Scalability**: Separate deployments allow independent scaling of frontend and backend

The Weatherman app can now leverage both client-side PWA capabilities and server-side API functionality while maintaining excellent performance and offline support.
