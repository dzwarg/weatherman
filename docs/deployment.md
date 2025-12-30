# Deployment Guide

**Version**: 0.1.0
**Last Updated**: 2025-12-30

## Overview

This guide covers deployment options for the Weatherman application, which consists of two packages in a monorepo structure:
- **Frontend**: React PWA (Progressive Web App)
- **Server**: Express.js API server

## Deployment Options

### Option 1: Separate Deployments (Recommended)

Deploy frontend and backend independently for maximum flexibility and scalability.

**Advantages**:
- Independent scaling (frontend CDN, backend auto-scaling)
- Frontend served from edge locations (faster global access)
- Backend can be scaled independently based on API load
- Easier to update one component without affecting the other

**Architecture**:
```
Frontend (Vercel/Netlify/Cloudflare Pages)
    ↓ API calls
Backend (Render/Railway/Fly.io/Heroku)
```

---

### Option 2: Monolith Deployment

Deploy both frontend and backend on a single server.

**Advantages**:
- Simpler deployment (single server)
- Lower cost for low-traffic applications
- No CORS configuration needed

**Trade-offs**:
- Frontend not served from CDN (slower for global users)
- Backend scaling affects frontend serving
- Single point of failure

---

## Option 1: Separate Deployments (Detailed)

### Frontend Deployment

#### 1. Build Frontend

```bash
npm run build --workspace=@weatherman/frontend
```

Output: `packages/frontend/dist/`

#### 2. Choose Platform

**Vercel (Recommended)**:
```bash
cd packages/frontend
vercel deploy --prod
```

**Netlify**:
```bash
cd packages/frontend
netlify deploy --prod --dir=dist
```

**Cloudflare Pages**:
```bash
# Connect GitHub repo in Cloudflare dashboard
# Build command: npm run build --workspace=@weatherman/frontend
# Output directory: packages/frontend/dist
```

#### 3. Configure Environment Variables

Set in your deployment platform:

```bash
# Production API base URL (your backend server)
VITE_API_BASE_URL=https://api.weatherman.app

# Mock AI flag (should be false in production)
VITE_USE_MOCK_AI=false
```

#### 4. Custom Domain Setup

- Frontend: `weatherman.app` or `www.weatherman.app`
- Backend: `api.weatherman.app`

Configure DNS:
```
A record:     weatherman.app → Frontend platform IP
CNAME record: api.weatherman.app → Backend platform domain
```

---

### Backend Deployment

#### 1. Choose Platform

**Render (Recommended)**:
- Supports Docker and native Node.js
- Auto-deploy from GitHub
- Free tier available

**Railway**:
- Simple deployment from GitHub
- Good developer experience
- Pay-as-you-go pricing

**Fly.io**:
- Edge deployment (multiple regions)
- Excellent performance
- Free tier with credit card

**Heroku**:
- Classic PaaS platform
- Simple deployment
- Paid plans only (no free tier)

#### 2. Deployment Configuration

Create `packages/server/Procfile` (for Heroku/Render):
```
web: node src/server.js
```

Or use npm start:
```json
// packages/server/package.json
"scripts": {
  "start": "node src/server.js"
}
```

#### 3. Environment Variables

Set in your deployment platform:

**Required**:
```bash
NODE_ENV=production
PORT=3000

# Weather API
WEATHER_API_KEY=your_openweather_api_key_here
WEATHER_API_URL=https://api.openweathermap.org/data/2.5

# Claude API (optional - falls back to rule-based)
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# CORS Configuration
ALLOWED_ORIGINS=https://weatherman.app,https://www.weatherman.app
# Or single origin:
# FRONTEND_URL=https://weatherman.app
```

**Optional**:
```bash
# Trust proxy (if behind load balancer)
TRUST_PROXY=true

# Rate limiting (override defaults)
WEATHER_RATE_LIMIT=100
RECOMMENDATIONS_RATE_LIMIT=500
```

#### 4. Deploy

**Render**:
1. Connect GitHub repository
2. Select `packages/server` as root directory
3. Build command: (none needed for plain Node.js)
4. Start command: `node src/server.js`
5. Add environment variables
6. Deploy

**Railway**:
```bash
cd packages/server
railway init
railway up
```

**Fly.io**:
```bash
cd packages/server
fly launch
fly deploy
```

---

## Option 2: Monolith Deployment (Detailed)

Deploy both frontend and backend on a single server using Express to serve static files.

### 1. Build Frontend

```bash
npm run build --workspace=@weatherman/frontend
```

### 2. Configure Server

Set environment variable:
```bash
SERVE_FRONTEND=true
```

The server will automatically serve frontend static files from `packages/frontend/dist/`.

### 3. Deploy

Deploy `packages/server/` to any Node.js hosting platform (Render, Railway, Heroku).

The server will:
- Serve API routes at `/api/*`
- Serve frontend static files for all other routes
- Handle SPA routing (all non-API routes return `index.html`)

---

## Pre-Deployment Checklist

### Frontend

- [ ] Build completes without errors: `npm run build --workspace=@weatherman/frontend`
- [ ] No API keys in bundle: `grep -r "API_KEY" packages/frontend/dist/`
- [ ] Service Worker generated: Check `packages/frontend/dist/sw.js` exists
- [ ] Manifest valid: Check `packages/frontend/dist/manifest.webmanifest`
- [ ] Environment variables configured on deployment platform
- [ ] Custom domain DNS configured (if applicable)

### Backend

- [ ] All tests passing: `npm run test --workspace=@weatherman/server`
- [ ] ESLint passing: `npm run lint --workspace=@weatherman/server`
- [ ] Environment variables documented: Check `.env.production.example`
- [ ] API keys secured (never committed to repository)
- [ ] CORS origins configured correctly
- [ ] Health check endpoint responds: `curl https://api.weatherman.app/api/health`

---

## Post-Deployment Verification

### 1. Health Checks

**Backend**:
```bash
curl https://api.weatherman.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T...",
  "services": {
    "weatherAPI": "available",
    "claudeAPI": "available"
  }
}
```

**Frontend**:
- Visit https://weatherman.app
- Check console for errors
- Verify Service Worker registered: DevTools → Application → Service Workers

### 2. API Integration

Test weather proxy:
```bash
curl -X POST https://api.weatherman.app/api/weather/current \
  -H "Content-Type: application/json" \
  -d '{"lat": 42.3601, "lon": -71.0589}'
```

Test recommendations:
```bash
curl -X POST https://api.weatherman.app/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "profile": {"id": "7yo-boy", "age": 7, "gender": "boy"},
    "weather": {"temperature": 65, "conditions": "Clear", "feelsLike": 63}
  }'
```

### 3. PWA Features

- [ ] Install prompt appears on mobile
- [ ] App installs successfully
- [ ] Offline mode works (disconnect network, reload app)
- [ ] Service Worker caches API responses
- [ ] Voice recognition works (requires HTTPS)
- [ ] App icon displays correctly on home screen

### 4. Performance

Run Lighthouse audit:
```bash
npm run lighthouse --workspace=@weatherman/frontend
```

Targets:
- PWA score: 100/100
- Performance: 90+
- Accessibility: 100
- Best Practices: 100

---

## Rollback Procedure

### Vercel/Netlify (Frontend)

1. Go to deployment dashboard
2. Find previous successful deployment
3. Click "Rollback" or "Promote to Production"

### Render/Railway (Backend)

1. Go to deployment dashboard
2. Select previous deployment from history
3. Click "Redeploy" or "Rollback"

### Manual Rollback

```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or checkout specific commit
git checkout <previous-commit-hash>
git push origin main --force
```

---

## Monitoring and Logs

### Frontend Monitoring

**Error Tracking**:
- Sentry, LogRocket, or browser console logs

**Analytics**:
- Google Analytics, Plausible, or Fathom

**Web Vitals**:
```javascript
// Already implemented in src/reportWebVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
```

### Backend Monitoring

**Application Performance Monitoring (APM)**:
- New Relic
- Datadog
- Application Insights

**Logging**:
- Platform logs (Render, Railway, Heroku)
- Structured logging with Winston or Pino (recommended)

**Alerting**:
- Set up alerts for:
  - P95 response time > 3000ms
  - Error rate > 5%
  - Health check failures
  - High memory usage

---

## Scaling Considerations

### Frontend Scaling

Frontend is served from CDN/edge network, automatically scales globally.

No additional configuration needed.

### Backend Scaling

**Vertical Scaling** (single instance):
- Increase CPU/RAM allocation
- Suitable for < 1000 concurrent users

**Horizontal Scaling** (multiple instances):
- Run multiple server instances behind load balancer
- Considerations:
  - Rate limiting: Switch from in-memory to Redis
  - Session management: Use Redis or database-backed sessions (if added later)

**Auto-scaling Configuration**:

Render:
```yaml
# render.yaml
services:
  - type: web
    name: weatherman-api
    env: node
    plan: standard
    numInstances: 2  # Or use auto-scaling
    scaling:
      minInstances: 1
      maxInstances: 5
      targetCPUPercent: 60
```

---

## Security Best Practices

### Frontend

- [ ] HTTPS enforced (automatic on Vercel/Netlify)
- [ ] Content Security Policy (CSP) headers configured
- [ ] No API keys in JavaScript bundle
- [ ] Service Worker only on HTTPS origins

### Backend

- [ ] Environment variables not committed to repository
- [ ] API keys stored in platform environment variables
- [ ] CORS properly configured (no wildcard `*` in production)
- [ ] Helmet.js middleware enabled
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive information

---

## Cost Estimates

### Option 1: Separate Deployments

**Frontend (Vercel/Netlify)**:
- Free tier: 100GB bandwidth/month
- Pro tier: $20/month (unlimited bandwidth)

**Backend (Render)**:
- Free tier: 750 hours/month (single instance)
- Starter: $7/month (512MB RAM)
- Standard: $25/month (2GB RAM)

**Total Estimated Cost**: $0-50/month depending on traffic

### Option 2: Monolith Deployment

**Single Server (Render)**:
- Starter: $7/month
- Standard: $25/month

**Total Estimated Cost**: $7-25/month

---

## Troubleshooting

### Issue: Frontend can't reach backend

**Symptoms**: API requests fail, CORS errors in browser console

**Solutions**:
1. Check `VITE_API_BASE_URL` environment variable
2. Verify CORS `ALLOWED_ORIGINS` includes frontend domain
3. Test backend health check: `curl https://api.weatherman.app/api/health`

### Issue: Service Worker not updating

**Symptoms**: Old version of app loads after deployment

**Solutions**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Unregister Service Worker: DevTools → Application → Service Workers → Unregister
3. Clear site data: DevTools → Application → Clear Storage → Clear site data

### Issue: Voice recognition not working

**Symptoms**: Wake word detection fails, no microphone access

**Solutions**:
1. Verify HTTPS (required for Web Speech API)
2. Check microphone permissions in browser
3. Test on Chrome/Edge (best support)
4. Note: Firefox has limited Web Speech API support

### Issue: Claude API errors

**Symptoms**: Recommendations return generic responses, API errors in logs

**Solutions**:
1. Verify `ANTHROPIC_API_KEY` is set correctly
2. Check API key has credits/quota
3. Test Claude API directly: `curl https://api.anthropic.com/v1/messages ...`
4. Fallback to rule-based recommendations (automatic)

---

## Continuous Deployment (CI/CD)

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build --workspace=@weatherman/frontend
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test --workspace=@weatherman/server
      - run: npm run lint --workspace=@weatherman/server
      # Deploy to Render, Railway, or Heroku
```

---

## Backup and Disaster Recovery

### Frontend

- Source code in GitHub (automatic backup)
- Deployments are immutable (can rollback anytime)
- No user data stored client-side (except profiles in localStorage)

### Backend

- Source code in GitHub (automatic backup)
- Stateless server (no database to backup)
- Environment variables backed up separately (1Password, Doppler, etc.)

### User Data

- User profiles stored in browser localStorage (client-side only)
- No server-side user data to backup
- Users can export/import profiles if needed (future feature)

---

## Support and Maintenance

### Regular Maintenance

**Weekly**:
- Check error logs for recurring issues
- Monitor API usage and costs
- Review performance metrics

**Monthly**:
- Update dependencies: `npm update`
- Security audit: `npm audit`
- Review and rotate API keys (if needed)
- Test backup/restore procedures

**Quarterly**:
- Lighthouse audit (maintain 100/100 PWA score)
- Load testing (verify 100+ concurrent requests)
- Review and update documentation

### Incident Response

1. **Detect**: Monitoring alerts or user reports
2. **Assess**: Check health checks, logs, and metrics
3. **Respond**: Apply hotfix or rollback to previous version
4. **Recover**: Verify service restored
5. **Review**: Post-mortem to prevent recurrence

---

## Additional Resources

- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Render Deployment Guide](https://render.com/docs)
- [PWA Deployment Best Practices](https://web.dev/pwa-checklist/)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Questions or Issues?**
- Check logs in deployment platform dashboard
- Review troubleshooting section above
- Consult platform-specific documentation
- Open GitHub issue for application-specific problems
