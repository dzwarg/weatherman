#!/bin/bash
#
# Emergency Rollback to Green Environment
#
# This script performs an emergency rollback to the Green environment
# by stopping the Blue environment and switching traffic back to Green.
#
# Prerequisites:
# - Green environment must be running and healthy
# - nginx installed and configured
# - sudo access for nginx reload
# - PM2 installed for process management
#
# Usage:
#   ./scripts/deployment/rollback-to-green.sh
#
# T038: Emergency rollback script

set -e

echo "🟢 Emergency Rollback to Green Environment"
echo "=========================================="

# Configuration
BLUE_PORT=3001
GREEN_PORT=3002
BLUE_FRONTEND="/var/www/weatherman/blue"
GREEN_FRONTEND="/var/www/weatherman/green"
STATE_DIR="/var/lib/weatherman/state"

# Check if Green environment is healthy
GREEN_HEALTH="http://localhost:$GREEN_PORT/health"
echo "Checking Green environment health..."

if ! curl -sf "$GREEN_HEALTH" > /dev/null 2>&1; then
  echo "❌ Error: Green environment is not healthy!"
  echo "Cannot rollback to unhealthy environment"
  echo "Green health check: $GREEN_HEALTH"
  exit 1
fi

echo "✅ Green environment is healthy"

# Switch traffic back to Green
echo ""
echo "Switching traffic back to Green..."
if ! bash "$(dirname "$0")/switch-traffic.sh" green; then
  echo "❌ Error: Failed to switch traffic to Green"
  exit 1
fi

# Stop Blue environment
echo ""
echo "Stopping Blue environment..."
pm2 stop weatherman-blue 2>/dev/null || echo "  (not running)"
pm2 delete weatherman-blue 2>/dev/null || echo "  (not found)"

# Update Blue state to failed
cat > "$STATE_DIR/blue.json" <<EOF
{
  "environment": "blue",
  "status": "failed",
  "backend_port": $BLUE_PORT,
  "frontend_dir": "$BLUE_FRONTEND",
  "rolled_back_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "reason": "Emergency rollback executed"
}
EOF

echo ""
echo "✅ Rollback complete!"
echo "Active environment: Green (port $GREEN_PORT)"
echo "Blue environment: Stopped and marked as failed"
echo ""
echo "Next steps:"
echo "  1. Investigate why Blue deployment failed"
echo "  2. Fix issues in code"
echo "  3. Deploy again when ready"
echo ""
echo "View logs:"
echo "  pm2 logs weatherman-green"
echo "  tail -f /var/log/nginx/error.log"
