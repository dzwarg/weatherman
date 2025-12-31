#!/bin/bash
#
# Switch Traffic Between Blue and Green Environments
#
# This script updates the nginx upstream configuration to route traffic
# to the specified environment (blue or green) and reloads nginx.
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
NGINX_CONF_BACKUP="/etc/nginx/sites-enabled/weatherman.backup"
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

# Determine target port and frontend directory
if [ "$TARGET_ENV" == "blue" ]; then
  TARGET_PORT=3001
  FRONTEND_DIR="/var/www/weatherman/blue"
  echo "🔵 Switching traffic to Blue environment"
  echo "   Backend: port 3001"
  echo "   Frontend: $FRONTEND_DIR"
else
  TARGET_PORT=3002
  FRONTEND_DIR="/var/www/weatherman/green"
  echo "🟢 Switching traffic to Green environment"
  echo "   Backend: port 3002"
  echo "   Frontend: $FRONTEND_DIR"
fi

# Verify target environment is healthy
HEALTH_URL="http://localhost:$TARGET_PORT/health"
echo "Checking health of $TARGET_ENV environment..."

if ! curl -sf "$HEALTH_URL" > /dev/null 2>&1; then
  echo "❌ Error: $TARGET_ENV environment is not healthy"
  echo "Health check failed: $HEALTH_URL"
  exit 1
fi

echo "✅ $TARGET_ENV environment is healthy"

# Backup current nginx config
if [ -f "$NGINX_CONF" ]; then
  echo "Backing up current nginx config..."
  sudo cp "$NGINX_CONF" "$NGINX_CONF_BACKUP"
fi

# Update nginx configuration (backend port and frontend directory)
echo "Updating nginx configuration..."

# Update backend upstream port
sudo sed -i "s|server localhost:[0-9]\+ max_fails|server localhost:$TARGET_PORT max_fails|g" "$NGINX_CONF"

# Update frontend root directory (all occurrences)
if [ "$TARGET_ENV" == "blue" ]; then
  sudo sed -i "s|root /var/www/weatherman/green|root /var/www/weatherman/blue|g" "$NGINX_CONF"
else
  sudo sed -i "s|root /var/www/weatherman/blue|root /var/www/weatherman/green|g" "$NGINX_CONF"
fi

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

ACTUAL_RESPONSE=$(curl -sf http://localhost/health 2>&1 || echo "failed")
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
  "backend_port": $TARGET_PORT,
  "frontend_dir": "$FRONTEND_DIR",
  "activated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

# Mark old environment as inactive
if [ "$TARGET_ENV" == "blue" ]; then
  OLD_ENV="green"
  OLD_PORT=3002
  OLD_FRONTEND_DIR="/var/www/weatherman/green"
else
  OLD_ENV="blue"
  OLD_PORT=3001
  OLD_FRONTEND_DIR="/var/www/weatherman/blue"
fi

cat > "$STATE_DIR/$OLD_ENV.json" <<EOF
{
  "environment": "$OLD_ENV",
  "status": "inactive",
  "backend_port": $OLD_PORT,
  "frontend_dir": "$OLD_FRONTEND_DIR",
  "deactivated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo ""
echo "✅ Traffic switch complete!"
echo "Active environment: $TARGET_ENV"
echo "  Backend port: $TARGET_PORT"
echo "  Frontend dir: $FRONTEND_DIR"
echo ""
echo "Inactive environment: $OLD_ENV"
echo "  Backend port: $OLD_PORT"
echo "  Frontend dir: $OLD_FRONTEND_DIR"
echo ""
echo "Monitor traffic:"
echo "  curl http://localhost/health"
echo "  tail -f /var/log/nginx/access.log"
