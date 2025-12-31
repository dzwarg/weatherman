#!/bin/bash
#
# Setup Deployment State Directory and Files
#
# This script initializes the deployment state directory and creates
# initial state files for Blue and Green environments.
#
# Prerequisites:
# - sudo access to create directories in /var/lib
# - Run once during initial server setup
#
# Usage:
#   sudo ./scripts/deployment/setup-deployment-state.sh
#
# T040-T042: Initialize deployment state

set -e

# Configuration
STATE_DIR="/var/lib/weatherman/state"
BLUE_STATE="$STATE_DIR/blue.json"
GREEN_STATE="$STATE_DIR/green.json"
BLUE_PORT=3001
GREEN_PORT=3002
BLUE_FRONTEND="/var/www/weatherman/blue"
GREEN_FRONTEND="/var/www/weatherman/green"

echo "🔧 Setting up deployment state directory..."
echo "==========================================="

# T040: Create deployment state directory
echo "Creating state directory: $STATE_DIR"
if [ ! -d "$STATE_DIR" ]; then
  sudo mkdir -p "$STATE_DIR"
  sudo chmod 755 "$STATE_DIR"
  echo "✅ State directory created"
else
  echo "✅ State directory already exists"
fi

# T041: Initialize Blue environment state (active by default)
echo ""
echo "Initializing Blue environment state..."
if [ ! -f "$BLUE_STATE" ]; then
  sudo tee "$BLUE_STATE" > /dev/null <<EOF
{
  "environment": "blue",
  "status": "active",
  "backend_port": $BLUE_PORT,
  "frontend_dir": "$BLUE_FRONTEND",
  "initialized_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "description": "Initial Blue environment - active by default"
}
EOF
  sudo chmod 644 "$BLUE_STATE"
  echo "✅ Blue state file created: $BLUE_STATE"
else
  echo "✅ Blue state file already exists"
fi

# T042: Initialize Green environment state (inactive by default)
echo ""
echo "Initializing Green environment state..."
if [ ! -f "$GREEN_STATE" ]; then
  sudo tee "$GREEN_STATE" > /dev/null <<EOF
{
  "environment": "green",
  "status": "inactive",
  "backend_port": $GREEN_PORT,
  "frontend_dir": "$GREEN_FRONTEND",
  "initialized_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "description": "Initial Green environment - inactive by default"
}
EOF
  sudo chmod 644 "$GREEN_STATE"
  echo "✅ Green state file created: $GREEN_STATE"
else
  echo "✅ Green state file already exists"
fi

# Display current state
echo ""
echo "📊 Current Deployment State"
echo "============================"
echo ""
echo "Blue environment:"
cat "$BLUE_STATE" | jq '.' 2>/dev/null || cat "$BLUE_STATE"
echo ""
echo "Green environment:"
cat "$GREEN_STATE" | jq '.' 2>/dev/null || cat "$GREEN_STATE"
echo ""

echo "✅ Deployment state setup complete!"
echo ""
echo "State directory: $STATE_DIR"
echo "Blue state: $BLUE_STATE"
echo "Green state: $GREEN_STATE"
echo ""
echo "Next steps:"
echo "  1. Start Blue environment: ./scripts/deployment/deploy-to-blue.sh"
echo "  2. Verify Blue is healthy: curl http://localhost:$BLUE_PORT/health"
echo "  3. Configure nginx to route to Blue (port $BLUE_PORT)"
