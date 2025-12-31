#!/bin/bash
#
# Install Nginx Configuration for Weatherman
#
# This script safely installs the nginx configuration with validation,
# backup, and rollback capabilities.
#
# Prerequisites:
# - nginx installed
# - Root/sudo access
#
# Usage:
#   sudo ./scripts/deployment/install-nginx-config.sh [server_name]
#
# Examples:
#   sudo ./scripts/deployment/install-nginx-config.sh
#   sudo ./scripts/deployment/install-nginx-config.sh weatherman.example.com
#   sudo ./scripts/deployment/install-nginx-config.sh localhost

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG_SOURCE="$SCRIPT_DIR/nginx-weatherman.conf"
CONFIG_DEST="/etc/nginx/sites-available/weatherman"
CONFIG_ENABLED="/etc/nginx/sites-enabled/weatherman"
DEFAULT_SERVER_NAME="weatherman.example.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Error: This script must be run as root${NC}"
  echo "Usage: sudo $0 [server_name]"
  exit 1
fi

# Get server name from argument or use default
if [ $# -eq 1 ]; then
  SERVER_NAME="$1"
  echo -e "${YELLOW}Using custom server name: $SERVER_NAME${NC}"
else
  SERVER_NAME="$DEFAULT_SERVER_NAME"
  echo -e "${YELLOW}Using default server name: $SERVER_NAME${NC}"
fi

echo ""
echo "🔧 Installing Nginx Configuration for Weatherman"
echo "================================================"
echo "Source: $CONFIG_SOURCE"
echo "Destination: $CONFIG_DEST"
echo "Enabled: $CONFIG_ENABLED"
echo "Server name: $SERVER_NAME"
echo ""

# Verify source config exists
if [ ! -f "$CONFIG_SOURCE" ]; then
  echo -e "${RED}❌ Error: Source configuration not found: $CONFIG_SOURCE${NC}"
  exit 1
fi

# Create temporary config with custom server name
TEMP_CONFIG=$(mktemp)
sed "s/weatherman\.example\.com/$SERVER_NAME/g" "$CONFIG_SOURCE" > "$TEMP_CONFIG"

echo "✅ Configuration prepared with server name: $SERVER_NAME"

# Validate nginx syntax
echo ""
echo "Validating nginx configuration..."
if ! nginx -t -c /etc/nginx/nginx.conf 2>&1 | grep -q "syntax is ok"; then
  echo -e "${YELLOW}⚠️  Current nginx configuration has issues${NC}"
  echo "Continuing with installation (will validate after)..."
fi

# Backup existing configuration if present
if [ -f "$CONFIG_DEST" ]; then
  BACKUP_FILE="$CONFIG_DEST.backup.$(date +%Y%m%d-%H%M%S)"
  echo "📦 Backing up existing configuration..."
  cp "$CONFIG_DEST" "$BACKUP_FILE"
  echo "   Backup: $BACKUP_FILE"
fi

# Install configuration
echo ""
echo "📝 Installing configuration to sites-available..."
cp "$TEMP_CONFIG" "$CONFIG_DEST"
chmod 644 "$CONFIG_DEST"
chown root:root "$CONFIG_DEST"

echo "✅ Configuration file installed"

# Create symbolic link to sites-enabled
echo ""
echo "🔗 Enabling site..."

if [ -L "$CONFIG_ENABLED" ]; then
  echo "   Symbolic link already exists"
elif [ -f "$CONFIG_ENABLED" ]; then
  echo -e "${YELLOW}⚠️  Regular file exists at $CONFIG_ENABLED (not a symlink)${NC}"
  ENABLED_BACKUP="$CONFIG_ENABLED.backup.$(date +%Y%m%d-%H%M%S)"
  mv "$CONFIG_ENABLED" "$ENABLED_BACKUP"
  echo "   Moved to: $ENABLED_BACKUP"
  ln -s "$CONFIG_DEST" "$CONFIG_ENABLED"
  echo "   Created symbolic link"
else
  ln -s "$CONFIG_DEST" "$CONFIG_ENABLED"
  echo "   Created symbolic link"
fi

# Validate complete nginx configuration
echo ""
echo "🔍 Validating complete nginx configuration..."

if nginx -t 2>&1 | grep -q "syntax is ok"; then
  echo -e "${GREEN}✅ Nginx configuration is valid${NC}"
else
  echo -e "${RED}❌ Error: Nginx configuration validation failed${NC}"
  echo ""
  echo "Rolling back changes..."

  # Remove symlink
  rm -f "$CONFIG_ENABLED"

  # Restore backup if exists
  if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    cp "$BACKUP_FILE" "$CONFIG_DEST"
    ln -s "$CONFIG_DEST" "$CONFIG_ENABLED"
    echo "Restored backup configuration"
  else
    rm -f "$CONFIG_DEST"
    echo "Removed invalid configuration"
  fi

  # Clean up temp file
  rm -f "$TEMP_CONFIG"

  echo ""
  echo "Run 'sudo nginx -t' to see detailed error messages"
  exit 1
fi

# Test if nginx is running
if systemctl is-active --quiet nginx; then
  NGINX_RUNNING=true
  echo ""
  echo "🔄 Reloading nginx..."

  if systemctl reload nginx; then
    echo -e "${GREEN}✅ Nginx reloaded successfully${NC}"
  else
    echo -e "${RED}❌ Error: Failed to reload nginx${NC}"
    echo ""
    echo "Configuration installed but not active."
    echo "Check nginx error logs:"
    echo "  sudo tail -f /var/log/nginx/error.log"

    # Clean up temp file
    rm -f "$TEMP_CONFIG"
    exit 1
  fi
else
  NGINX_RUNNING=false
  echo ""
  echo -e "${YELLOW}⚠️  Nginx is not running${NC}"
  echo "Configuration installed but nginx needs to be started:"
  echo "  sudo systemctl start nginx"
fi

# Clean up temp file
rm -f "$TEMP_CONFIG"

# Create log directory if it doesn't exist
if [ ! -d "/var/log/nginx" ]; then
  mkdir -p /var/log/nginx
  echo "Created log directory: /var/log/nginx"
fi

# Display installation summary
echo ""
echo "═══════════════════════════════════════════════"
echo -e "${GREEN}✅ Installation Complete!${NC}"
echo "═══════════════════════════════════════════════"
echo ""
echo "📋 Configuration Summary:"
echo "   Server name: $SERVER_NAME"
echo "   Config file: $CONFIG_DEST"
echo "   Symlink: $CONFIG_ENABLED"
echo "   Active environment: Blue (port 3000)"
echo "   Inactive environment: Green (port 3001)"
echo ""
echo "📊 Status:"
if [ "$NGINX_RUNNING" = true ]; then
  echo -e "   Nginx: ${GREEN}Running ✓${NC}"
else
  echo -e "   Nginx: ${YELLOW}Not running${NC}"
fi
echo ""
echo "🔍 Verify Installation:"
echo "   sudo nginx -t"
echo "   curl -I http://$SERVER_NAME/health"
echo "   sudo systemctl status nginx"
echo ""
echo "📝 View Logs:"
echo "   sudo tail -f /var/log/nginx/weatherman-access.log"
echo "   sudo tail -f /var/log/nginx/weatherman-error.log"
echo ""
echo "🔄 Next Steps:"
echo "   1. Update server_name in config if needed:"
echo "      sudo nano $CONFIG_DEST"
echo "      sudo nginx -t && sudo systemctl reload nginx"
echo ""
echo "   2. Start Blue environment:"
echo "      ./scripts/deployment/deploy-to-blue.sh"
echo ""
echo "   3. Test application:"
echo "      curl http://$SERVER_NAME/health"
echo ""
echo "   4. Configure SSL (optional):"
echo "      # Use certbot for Let's Encrypt"
echo "      sudo certbot --nginx -d $SERVER_NAME"
echo ""
echo "   5. Enable HTTPS redirect (after SSL):"
echo "      # Uncomment HTTPS server block in config"
echo "      sudo nano $CONFIG_DEST"
echo ""

if [ -n "$BACKUP_FILE" ]; then
  echo "📦 Backup Location:"
  echo "   $BACKUP_FILE"
  echo ""
fi
