#!/bin/bash
#
# Diagnose Sudo Configuration Issues
#
# This script helps diagnose why sudo commands require a password
# for the deployment user.
#
# Usage:
#   ./scripts/deployment/diagnose-sudo.sh

set -e

echo "🔍 Sudo Configuration Diagnostics"
echo "=================================="
echo ""

# Check current user
echo "Current user information:"
echo "  Username: $(whoami)"
echo "  UID: $(id -u)"
echo "  GID: $(id -g)"
echo "  Groups: $(groups)"
echo ""

# Check if sudoers file exists
SUDOERS_FILE="/etc/sudoers.d/weatherman"
echo "Checking sudoers file:"
if [ -f "$SUDOERS_FILE" ]; then
  echo "  ✅ File exists: $SUDOERS_FILE"
  echo "  Permissions: $(stat -c '%a %U:%G' "$SUDOERS_FILE" 2>/dev/null || stat -f '%p %Su:%Sg' "$SUDOERS_FILE" 2>/dev/null)"
else
  echo "  ❌ File NOT found: $SUDOERS_FILE"
  echo ""
  echo "To install the sudoers file:"
  echo "  sudo ./scripts/deployment/install-sudoers.sh $(whoami)"
  exit 1
fi
echo ""

# Check sudo permissions for current user
echo "Checking sudo permissions for $(whoami):"
if sudo -l -U "$(whoami)" &>/dev/null; then
  echo "  ✅ User has sudo permissions"
  echo ""
  echo "Allowed commands:"
  sudo -l -U "$(whoami)" 2>/dev/null | grep -A 100 "may run the following"
else
  echo "  ❌ Cannot query sudo permissions"
  echo "  This usually means the sudoers file doesn't grant permissions to this user"
fi
echo ""

# Test NOPASSWD configuration
echo "Testing NOPASSWD configuration:"
if sudo -n true 2>/dev/null; then
  echo "  ✅ NOPASSWD works - sudo commands can run without password"
else
  echo "  ❌ NOPASSWD not working - sudo requires password"
  echo ""
  echo "Possible causes:"
  echo "  1. The sudoers file uses 'weatherman' but you're running as '$(whoami)'"
  echo "  2. Another sudoers rule is taking precedence"
  echo "  3. The sudoers file has syntax errors"
  echo ""
  echo "To fix:"
  echo "  sudo ./scripts/deployment/install-sudoers.sh $(whoami)"
fi
echo ""

# Check if running specific deployment commands works
echo "Testing specific deployment commands:"
TEST_COMMANDS=(
  "mkdir -p /var/lib/weatherman/state"
  "nginx -t"
)

for cmd in "${TEST_COMMANDS[@]}"; do
  CMD_PATH=$(which ${cmd%% *} 2>/dev/null || echo "command not found")
  echo "  Testing: sudo -n $cmd"
  if [ "$CMD_PATH" == "command not found" ]; then
    echo "    ⚠️  Command not found: ${cmd%% *}"
  elif sudo -n $cmd &>/dev/null 2>&1; then
    echo "    ✅ Works without password"
  else
    echo "    ❌ Requires password or not allowed"
  fi
done
echo ""

# Show sudoers file content (requires sudo)
echo "Sudoers file content (requires sudo to view):"
if sudo -n cat "$SUDOERS_FILE" &>/dev/null; then
  echo "----------------------------------------"
  sudo cat "$SUDOERS_FILE" | head -20
  echo "----------------------------------------"
else
  echo "  (Cannot display - requires password)"
fi
