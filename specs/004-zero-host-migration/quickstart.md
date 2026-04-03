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
| `OPENWEATHERMAP_API_KEY` | Your API key |
| `NODE_VERSION` | `22` |

## Step 4: Deploy

### Option A: Git Push (Automatic)

Every push to `main` triggers deployment automatically.

### Option B: CLI Deploy

```bash
# Frontend
cd packages/frontend
netlify deploy --prod --dir=dist

# Server
cd packages/server
netlify deploy --prod --functions=netlify/functions
```

## Step 5: Local Development

```bash
# Install dependencies
npm install

# Start local dev server with function emulation
npm run dev

# Or use netlify dev
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

## Rollback

In Netlify dashboard:
1. Deploys → History
2. Select previous working deployment
3. Click "Publish deploy"
