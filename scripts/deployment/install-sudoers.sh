#!/bin/bash
#
# Install Weatherman Sudoers Configuration
#
# This script safely installs the sudoers configuration for the weatherman
# deployment role with syntax validation.
#
# Prerequisites:
# - Root access (run with sudo)
# - visudo command available
#
# Usage:
#   sudo ./scripts/deployment/install-sudoers.sh [username]
#
# Examples:
#   sudo ./scripts/deployment/install-sudoers.sh weatherman
#   sudo ./scripts/deployment/install-sudoers.sh github-runner

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SUDOERS_SOURCE="$SCRIPT_DIR/weatherman-sudoers"
SUDOERS_DEST="/etc/sudoers.d/weatherman"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Error: This script must be run as root"
  echo "Usage: sudo $0 [username]"
  exit 1
fi

# Get target username
if [ $# -eq 1 ]; then
  TARGET_USER="$1"
  echo "Customizing sudoers file for user: $TARGET_USER"

  # Verify user exists
  if ! id "$TARGET_USER" &>/dev/null; then
    echo "⚠️  Warning: User '$TARGET_USER' does not exist"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi

  # Create temporary customized version
  TEMP_SUDOERS=$(mktemp)
  sed "s/User_Alias DEPLOY_USERS = weatherman/User_Alias DEPLOY_USERS = $TARGET_USER/" \
    "$SUDOERS_SOURCE" > "$TEMP_SUDOERS"
  SUDOERS_SOURCE="$TEMP_SUDOERS"
else
  echo "Using default user: weatherman"
  TARGET_USER="weatherman"
fi

echo ""
echo "🔒 Installing Weatherman Sudoers Configuration"
echo "=============================================="
echo "Source: $SUDOERS_SOURCE"
echo "Destination: $SUDOERS_DEST"
echo "User/Role: $TARGET_USER"
echo ""

# Validate syntax before installing
echo "Validating sudoers syntax..."
if ! visudo -c -f "$SUDOERS_SOURCE"; then
  echo "❌ Error: Sudoers file has syntax errors"
  [ -n "$TEMP_SUDOERS" ] && rm -f "$TEMP_SUDOERS"
  exit 1
fi

echo "✅ Syntax validation passed"

# Backup existing file if present
if [ -f "$SUDOERS_DEST" ]; then
  BACKUP="$SUDOERS_DEST.backup.$(date +%Y%m%d-%H%M%S)"
  echo "Backing up existing file to: $BACKUP"
  cp "$SUDOERS_DEST" "$BACKUP"
fi

# Install sudoers file
echo "Installing sudoers file..."
cp "$SUDOERS_SOURCE" "$SUDOERS_DEST"

# Set correct permissions (required by sudo)
chmod 440 "$SUDOERS_DEST"
chown root:root "$SUDOERS_DEST"

echo "✅ File permissions set: 440 (root:root)"

# Clean up temp file
[ -n "$TEMP_SUDOERS" ] && rm -f "$TEMP_SUDOERS"

# Verify installation
echo ""
echo "Verifying installation..."
if visudo -c; then
  echo "✅ Sudoers configuration installed successfully!"
else
  echo "❌ Error: Sudoers validation failed after installation"
  echo "Restoring backup..."
  if [ -n "$BACKUP" ]; then
    cp "$BACKUP" "$SUDOERS_DEST"
  else
    rm -f "$SUDOERS_DEST"
  fi
  exit 1
fi

echo ""
echo "📋 Configuration Summary"
echo "========================"
echo "User: $TARGET_USER"
echo "Allowed commands:"
echo "  - Nginx configuration management (copy, edit, test, reload)"
echo "  - Deployment state directory management (/var/lib/weatherman/state/)"
echo ""
echo "Test permissions:"
echo "  sudo -l -U $TARGET_USER"
echo ""
echo "View logs (if enabled):"
echo "  sudo cat /var/log/sudo-io/00/00/01/log"
