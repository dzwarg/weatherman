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

# Deploy backend to stable location
BACKEND_DEPLOY_DIR="/opt/weatherman/$ENV_NAME"
echo ""
echo "Deploying backend to stable location..."
echo "Target: $BACKEND_DEPLOY_DIR"

# Remove old backend deployment completely
sudo rm -rf "$BACKEND_DEPLOY_DIR"

# Create backend deployment directory
sudo mkdir -p "$BACKEND_DEPLOY_DIR"

# Copy backend code to deployment directory
sudo cp -r packages/server/. "$BACKEND_DEPLOY_DIR/"

# Copy package-lock.json for npm ci (monorepo structure)
sudo cp package-lock.json "$BACKEND_DEPLOY_DIR/"

# Copy PM2 config to deployment directory
sudo cp "$PM2_CONFIG" "$BACKEND_DEPLOY_DIR/"

# Set ownership to weatherman user
sudo chown -R weatherman:weatherman "$BACKEND_DEPLOY_DIR"

# Set proper permissions
sudo chmod -R 755 "$BACKEND_DEPLOY_DIR"

echo "✅ Backend code deployed to $BACKEND_DEPLOY_DIR"

# Install dependencies in deployment directory
echo ""
echo "Installing backend dependencies in deployment directory..."
cd "$BACKEND_DEPLOY_DIR"
npm ci --omit=dev
cd "$WORK_DIR"
echo "✅ Backend dependencies installed"

# Create logs directory in deployment location
mkdir -p "$BACKEND_DEPLOY_DIR/logs"

# Create .env file in deployment directory
echo ""
echo "Creating .env file in deployment directory..."
cat > "$BACKEND_DEPLOY_DIR/.env" << EOF
NODE_ENV=production
PORT=$PORT
ENV_NAME=$ENV_NAME
WEATHER_API_KEY=$WEATHER_API_KEY
WEATHER_API_URL=$WEATHER_API_URL
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY
CLAUDE_MODEL=$CLAUDE_MODEL
EOF
chmod 600 "$BACKEND_DEPLOY_DIR/.env"
echo "✅ Environment file created in deployment directory"

# Deploy frontend static files to environment-specific directory
FRONTEND_DEPLOY_DIR="/var/www/weatherman/$ENV_NAME"
echo ""
echo "Deploying frontend static files..."
echo "Target: $FRONTEND_DEPLOY_DIR"

# Remove old deployment directory completely (no wildcards)
sudo rm -rf "$FRONTEND_DEPLOY_DIR"

# Create deployment directory (including parent if needed)
sudo mkdir -p "$FRONTEND_DEPLOY_DIR"

# Copy frontend build contents to deployment directory
sudo cp -r packages/frontend/dist/. "$FRONTEND_DEPLOY_DIR/"

# Set correct permissions for nginx
sudo chown -R www-data:www-data "$FRONTEND_DEPLOY_DIR"
sudo chmod -R 755 "$FRONTEND_DEPLOY_DIR"

echo "✅ Frontend files deployed to $FRONTEND_DEPLOY_DIR"

# Stop existing Blue environment (if running)
echo ""
echo "Stopping existing Blue environment..."
npx pm2 stop "$PM2_APP_NAME" 2>/dev/null || echo "  (not running)"
npx pm2 delete "$PM2_APP_NAME" 2>/dev/null || echo "  (not found)"

# Start Blue environment with PM2 from deployment directory
echo ""
echo "Starting Blue environment..."
npx pm2 start "$BACKEND_DEPLOY_DIR/$PM2_CONFIG" --env production

# Wait for PM2 to initialize
sleep 2

# Verify PM2 process is running
if npx pm2 list | grep -q "$PM2_APP_NAME.*online"; then
  echo "✅ Blue environment started successfully"
  npx pm2 list | grep "$PM2_APP_NAME"
else
  echo "❌ Failed to start Blue environment"
  npx pm2 logs "$PM2_APP_NAME" --lines 20 --nostream
  exit 1
fi

echo ""
echo "🔵 Blue environment deployment complete!"
echo "Health check URL: http://localhost:$PORT/api/health"
echo ""
echo "Next steps:"
echo "  1. Wait for health check to pass"
echo "  2. Run post-deployment tests"
echo "  3. Switch traffic with: ./scripts/deployment/switch-traffic.sh blue"
