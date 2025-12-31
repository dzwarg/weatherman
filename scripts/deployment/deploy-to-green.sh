#!/bin/bash
#
# Deploy to Green Environment (Port 3001)
#
# This script deploys the Weatherman application to the Green environment
# as part of the blue-green deployment strategy.
#
# Prerequisites:
# - PM2 installed globally
# - Node.js 22+ installed
# - Application built (npm run build completed)
#
# Usage:
#   ./scripts/deployment/deploy-to-green.sh
#
# T036: Green environment deployment script

set -e

# Configuration
ENV_NAME="green"
PORT=3001
PM2_APP_NAME="weatherman-green"
PM2_CONFIG="pm2.green.config.js"
WORK_DIR=$(pwd)

echo "🟢 Deploying to Green environment..."
echo "========================================"
echo "Environment: $ENV_NAME"
echo "Port: $PORT"
echo "PM2 App: $PM2_APP_NAME"
echo "Working Directory: $WORK_DIR"
echo ""

# Verify PM2 config exists
if [ ! -f "$PM2_CONFIG" ]; then
  echo "❌ Error: PM2 config not found: $PM2_CONFIG"
  exit 1
fi

# Verify build artifacts exist
if [ ! -d "packages/frontend/dist" ]; then
  echo "❌ Error: Frontend build not found (packages/frontend/dist)"
  echo "Run 'npm run build --workspace=packages/frontend' first"
  exit 1
fi

# Stop existing Green environment (if running)
echo "Stopping existing Green environment..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || echo "  (not running)"
pm2 delete "$PM2_APP_NAME" 2>/dev/null || echo "  (not found)"

# Start Green environment with PM2
echo ""
echo "Starting Green environment..."
pm2 start "$PM2_CONFIG" --env production

# Wait for PM2 to initialize
sleep 2

# Verify PM2 process is running
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
  echo "✅ Green environment started successfully"
  pm2 list | grep "$PM2_APP_NAME"
else
  echo "❌ Failed to start Green environment"
  pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
  exit 1
fi

echo ""
echo "🟢 Green environment deployment complete!"
echo "Health check URL: http://localhost:$PORT/health"
echo ""
echo "Next steps:"
echo "  1. Wait for health check to pass"
echo "  2. Run post-deployment tests"
echo "  3. Switch traffic with: ./scripts/deployment/switch-traffic.sh green"
