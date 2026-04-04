# Netlify Deployment Quickstart

**Spec**: 004-zero-host-migration  
**Provider**: Netlify  
**Date**: 2026-04-03

## Prerequisites

1. Node.js 22+ installed
2. GitHub account with repository access
3. Netlify account (free tier)

## Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
netlify login
```

## Step 2: Connect Repository to Netlify

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub and select `weatherman` repository
4. Configure build settings:

**Frontend (packages/frontend)**:
```toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Server (packages/server)**:
```toml
[build]
  command = "echo 'No build step for serverless functions'"
  functions = "netlify/functions"
```

## Step 3: Configure Environment Variables

In Netlify dashboard → Site settings → Environment variables:

| Variable | Value |
|----------|-------|
| `WEATHER_API_KEY` | OpenWeatherMap API key |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `NODE_VERSION` | `22` |
| `FRONTEND_URL` | Your Netlify site URL (optional, defaults to `https://weatherman.app`) |

**Note**: Rate limits are hardcoded in the application (15 min window: 100 weather requests, 500 recommendation requests) and cannot be configured via environment variables.

## Step 4: CLI Authentication (Optional)

For CLI deployments, authenticate with Netlify:

```bash
# Option A: Interactive login (opens browser)
netlify login

# Option B: Using API token (for CI/CD)
# Set NETLIFY_TOKEN environment variable
export NETLIFY_TOKEN="your-netlify-api-token"
```

To create an API token: Netlify dashboard → User settings → OAuth → Personal access tokens.

## Step 5: Deploy

### Option A: Git Push (Automatic)

Every push to `main` triggers deployment automatically.

### Option B: CLI Deploy

```bash
# From repo root (netlify.toml handles both frontend and functions)
netlify deploy --prod
```

## Step 6: Frontend API Configuration

The frontend must point to the Netlify functions endpoint. Set in Netlify dashboard or `.env`:

```
VITE_API_BASE_URL=https://[site-name].netlify.app/.netlify/functions
```

## Step 7: Local Development

```bash
# Install dependencies
npm install

# Start local dev server with function emulation
npm run dev

# Or use netlify dev (requires NETLIFY_TOKEN for function access)
netlify dev
```

## URLs

After deployment:

- **Frontend**: `https://[site-name].netlify.app`
- **API**: `https://[site-name].netlify.app/.netlify/functions/[function-name]`

Example:
- Frontend: `https://weatherman-pwa.netlify.app`
- Weather API: `https://weatherman-pwa.netlify.app/.netlify/functions/weather-current`

## Troubleshooting

### Functions returning 404

Ensure `netlify.toml` points to correct functions directory:
```toml
[build]
  functions = "netlify/functions"
```

### CORS errors

Functions include CORS headers for Netlify frontend domain.

### Cold starts

First request after inactivity may take 1-2 seconds. Use keep-alive pings if latency is critical.

## Monitoring

- **Dashboard**: Netlify dashboard → Your site → Function logs
- **Metrics**: Netlify dashboard → Analytics
- **Logs**: `netlify functions:invoke [name] --log`

## Deployment Types

Netlify automatically handles all deployments via the GitHub app:

| Type | Trigger | URL |
|------|---------|-----|
| **Production** | Push to `main` | `*.netlify.app` |
| **Deploy Preview** | PR opened/updated | `deploy-preview-*.netlify.app` |
| **Branch Deploy** | Push to any other branch | `branch-name--*.netlify.app` |

### Branch Deploys

Branch deploys are automatically enabled. Each branch push creates a deploy with a unique URL. To disable branch deploys for a specific branch, add it to the `deploy-notifications` setting or configure in Netlify dashboard.

### Rollback

In Netlify dashboard:
1. Deploys → History
2. Select previous working deployment
3. Click "Publish deploy"

Or use the Netlify CLI:
```bash
netlify deploys:restore --id [deploy-id]
```
