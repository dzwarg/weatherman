#!/bin/bash
#
# Deploy to Blue Environment (Port 3000)
#
# This script deploys the Weatherman application to the Blue environment
# as part of the blue-green deployment strategy.
#
# Prerequisites:
# - PM2 installed globally
# - Node.js 22+ installed
# - Application built (npm run build completed)
#
# Usage:
#   ./scripts/deployment/deploy-to-blue.sh
#
# T036: Blue environment deployment script

set -e

# Configuration
ENV_NAME="blue"
PORT=3001
PM2_APP_NAME="weatherman-blue"
PM2_CONFIG="pm2.blue.config.js"
WORK_DIR=$(pwd)

echo "🔵 Deploying to Blue environment..."
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

# Deploy frontend static files to environment-specific directory
FRONTEND_DEPLOY_DIR="/var/www/weatherman/$ENV_NAME"
echo "Deploying frontend static files..."
echo "Target: $FRONTEND_DEPLOY_DIR"

# Remove old deployment directory completely (no wildcards)
sudo rm -rf "$FRONTEND_DEPLOY_DIR"

# Copy frontend build to deployment directory (dist becomes the directory)
sudo cp -r packages/frontend/dist "$FRONTEND_DEPLOY_DIR"

# Set correct permissions for nginx
sudo chown -R www-data:www-data "$FRONTEND_DEPLOY_DIR"
sudo chmod -R 755 "$FRONTEND_DEPLOY_DIR"

echo "✅ Frontend files deployed to $FRONTEND_DEPLOY_DIR"

# Stop existing Blue environment (if running)
echo ""
echo "Stopping existing Blue environment..."
pm2 stop "$PM2_APP_NAME" 2>/dev/null || echo "  (not running)"
pm2 delete "$PM2_APP_NAME" 2>/dev/null || echo "  (not found)"

# Start Blue environment with PM2
echo ""
echo "Starting Blue environment..."
pm2 start "$PM2_CONFIG" --env production

# Wait for PM2 to initialize
sleep 2

# Verify PM2 process is running
if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
  echo "✅ Blue environment started successfully"
  pm2 list | grep "$PM2_APP_NAME"
else
  echo "❌ Failed to start Blue environment"
  pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
  exit 1
fi

echo ""
echo "🔵 Blue environment deployment complete!"
echo "Health check URL: http://localhost:$PORT/health"
echo ""
echo "Next steps:"
echo "  1. Wait for health check to pass"
echo "  2. Run post-deployment tests"
echo "  3. Switch traffic with: ./scripts/deployment/switch-traffic.sh blue"
