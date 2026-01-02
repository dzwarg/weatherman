#!/bin/bash
#
# Switch Traffic Between Blue and Green Environments
#
# This script updates the nginx upstream configuration to route traffic
# to the specified environment (blue port 3101 or green port 3102).
#
# Prerequisites:
# - nginx installed and configured
# - sudo access for nginx reload
# - Target environment must be running and healthy
#
# Usage:
#   ./scripts/deployment/switch-traffic.sh <environment>
#   ./scripts/deployment/switch-traffic.sh blue
#   ./scripts/deployment/switch-traffic.sh green
#
# T037: Traffic switching script for blue-green deployment

set -e

# Configuration
NGINX_CONF="/etc/nginx/sites-enabled/weatherman"
BACKUP_DIR="/var/lib/weatherman/backups"
NGINX_CONF_BACKUP="$BACKUP_DIR/nginx-weatherman.backup.$(date +%Y%m%d-%H%M%S)"
STATE_DIR="/var/lib/weatherman/state"

# Validate arguments
if [ $# -ne 1 ]; then
  echo "Usage: $0 <environment>"
  echo "  environment: blue or green"
  exit 1
fi

TARGET_ENV="$1"

# Validate environment
if [ "$TARGET_ENV" != "blue" ] && [ "$TARGET_ENV" != "green" ]; then
  echo "❌ Error: Environment must be 'blue' or 'green'"
  exit 1
fi

# Determine target nginx port
if [ "$TARGET_ENV" == "blue" ]; then
  TARGET_NGINX_PORT=3101
  TARGET_BACKEND_PORT=3001
  FRONTEND_DIR="/var/www/weatherman/blue"
  echo "🔵 Switching traffic to Blue environment"
  echo "   Nginx port: 3101"
  echo "   Backend port: 3001"
  echo "   Frontend: $FRONTEND_DIR"
else
  TARGET_NGINX_PORT=3102
  TARGET_BACKEND_PORT=3002
  FRONTEND_DIR="/var/www/weatherman/green"
  echo "🟢 Switching traffic to Green environment"
  echo "   Nginx port: 3102"
  echo "   Backend port: 3002"
  echo "   Frontend: $FRONTEND_DIR"
fi

# Verify target environment is healthy
HEALTH_URL="http://localhost:$TARGET_NGINX_PORT/api/health"
echo "Checking health of $TARGET_ENV environment..."

if ! curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
  echo "❌ Error: $TARGET_ENV environment is not healthy"
  echo "Health check failed: $HEALTH_URL"
  exit 1
fi

echo "✅ $TARGET_ENV environment is healthy"

# Ensure backup directory exists
echo "Ensuring backup directory exists..."
sudo mkdir -p "$BACKUP_DIR"

# Backup current nginx config
if [ -f "$NGINX_CONF" ]; then
  echo "Backing up current nginx config..."
  sudo cp "$NGINX_CONF" "$NGINX_CONF_BACKUP"
  echo "✅ Backup created: $NGINX_CONF_BACKUP"
fi

# Update nginx configuration (upstream port)
echo "Updating nginx configuration..."

# Update upstream weatherman_active to point to target nginx port
sudo sed -i "s|server localhost:[0-9]\+ max_fails|server localhost:$TARGET_NGINX_PORT max_fails|g" "$NGINX_CONF"

# Verify nginx configuration syntax
echo "Verifying nginx configuration..."
if ! sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
  echo "❌ Error: Nginx configuration syntax error"
  echo "Restoring backup configuration..."
  sudo cp "$NGINX_CONF_BACKUP" "$NGINX_CONF"
  exit 1
fi

echo "✅ Nginx configuration is valid"

# Reload nginx
echo "Reloading nginx..."
if ! sudo systemctl reload nginx; then
  echo "❌ Error: Failed to reload nginx"
  echo "Restoring backup configuration..."
  sudo cp "$NGINX_CONF_BACKUP" "$NGINX_CONF"
  sudo systemctl reload nginx
  exit 1
fi

echo "✅ Nginx reloaded successfully"

# Verify traffic is routing to new environment
echo "Verifying traffic routing..."
sleep 2

ACTUAL_RESPONSE=$(curl -sf http://localhost/api/health 2>&1 || echo "failed")
if [ "$ACTUAL_RESPONSE" == "failed" ]; then
  echo "⚠️  Warning: Could not verify traffic routing"
else
  echo "✅ Traffic is routing successfully"
fi

# Update deployment state files
echo "Updating deployment state..."

# Mark new environment as active
cat > "$STATE_DIR/$TARGET_ENV.json" <<EOF
{
  "environment": "$TARGET_ENV",
  "status": "active",
  "nginx_port": $TARGET_NGINX_PORT,
  "backend_port": $TARGET_BACKEND_PORT,
  "frontend_dir": "$FRONTEND_DIR",
  "activated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Mark old environment as inactive
if [ "$TARGET_ENV" == "blue" ]; then
  OLD_ENV="green"
  OLD_NGINX_PORT=3102
  OLD_BACKEND_PORT=3002
  OLD_FRONTEND_DIR="/var/www/weatherman/green"
else
  OLD_ENV="blue"
  OLD_NGINX_PORT=3101
  OLD_BACKEND_PORT=3001
  OLD_FRONTEND_DIR="/var/www/weatherman/blue"
fi

cat > "$STATE_DIR/$OLD_ENV.json" <<EOF
{
  "environment": "$OLD_ENV",
  "status": "inactive",
  "nginx_port": $OLD_NGINX_PORT,
  "backend_port": $OLD_BACKEND_PORT,
  "frontend_dir": "$OLD_FRONTEND_DIR",
  "deactivated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "✅ Traffic switch complete!"
echo "Active environment: $TARGET_ENV"
echo "  Nginx port: $TARGET_NGINX_PORT"
echo "  Backend port: $TARGET_BACKEND_PORT"
echo "  Frontend dir: $FRONTEND_DIR"
echo ""
echo "Inactive environment: $OLD_ENV"
echo "  Nginx port: $OLD_NGINX_PORT"
echo "  Backend port: $OLD_BACKEND_PORT"
echo "  Frontend dir: $OLD_FRONTEND_DIR"
echo ""
echo "Monitor traffic:"
echo "  curl http://localhost/api/health"
echo "  tail -f /var/log/nginx/access.log"
