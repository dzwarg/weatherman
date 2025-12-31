#!/bin/bash
#
# Emergency Rollback to Blue Environment
#
# This script performs an emergency rollback to the Blue environment
# by stopping the Green environment and switching traffic back to Blue.
#
# Prerequisites:
# - Blue environment must be running and healthy
# - nginx installed and configured
# - sudo access for nginx reload
# - PM2 installed for process management
#
# Usage:
#   ./scripts/deployment/rollback-to-blue.sh
#
# T038: Emergency rollback script

set -e

echo "🔵 Emergency Rollback to Blue Environment"
echo "=========================================="

# Configuration
BLUE_PORT=3000
GREEN_PORT=3001
STATE_DIR="/var/lib/weatherman/state"

# Check if Blue environment is healthy
BLUE_HEALTH="http://localhost:$BLUE_PORT/health"
echo "Checking Blue environment health..."

if ! curl -sf "$BLUE_HEALTH" > /dev/null 2>&1; then
  echo "❌ Error: Blue environment is not healthy!"
  echo "Cannot rollback to unhealthy environment"
  echo "Blue health check: $BLUE_HEALTH"
  exit 1
fi

echo "✅ Blue environment is healthy"

# Switch traffic back to Blue
echo ""
echo "Switching traffic back to Blue..."
if ! bash "$(dirname "$0")/switch-traffic.sh" blue; then
  echo "❌ Error: Failed to switch traffic to Blue"
  exit 1
fi

# Stop Green environment
echo ""
echo "Stopping Green environment..."
pm2 stop weatherman-green 2>/dev/null || echo "  (not running)"
pm2 delete weatherman-green 2>/dev/null || echo "  (not found)"

# Update Green state to failed
cat > "$STATE_DIR/green.json" <<EOF
{
  "environment": "green",
  "status": "failed",
  "port": $GREEN_PORT,
  "rolled_back_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "reason": "Emergency rollback executed"
}
EOF

echo ""
echo "✅ Rollback complete!"
echo "Active environment: Blue (port $BLUE_PORT)"
echo "Green environment: Stopped and marked as failed"
echo ""
echo "Next steps:"
echo "  1. Investigate why Green deployment failed"
echo "  2. Fix issues in code"
echo "  3. Deploy again when ready"
echo ""
echo "View logs:"
echo "  pm2 logs weatherman-blue"
echo "  tail -f /var/log/nginx/error.log"
