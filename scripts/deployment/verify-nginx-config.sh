#!/bin/bash
#
# Verify Nginx Configuration for Weatherman
#
# This script verifies that nginx is properly configured and operational
# for blue-green deployments.
#
# Usage:
#   ./scripts/deployment/verify-nginx-config.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

CONFIG_FILE="/etc/nginx/sites-available/weatherman"
ENABLED_LINK="/etc/nginx/sites-enabled/weatherman"
BLUE_PORT=3001
GREEN_PORT=3002

echo ""
echo "🔍 Verifying Nginx Configuration for Weatherman"
echo "================================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Configuration file exists
echo -n "1. Configuration file exists... "
if [ -f "$CONFIG_FILE" ]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "   File not found: $CONFIG_FILE"
  echo "   Run: sudo ./scripts/deployment/install-nginx-config.sh"
  ERRORS=$((ERRORS + 1))
fi

# Check 2: Symbolic link exists
echo -n "2. Site is enabled (symlink)... "
if [ -L "$ENABLED_LINK" ]; then
  echo -e "${GREEN}✓${NC}"
  LINK_TARGET=$(readlink -f "$ENABLED_LINK")
  if [ "$LINK_TARGET" != "$CONFIG_FILE" ]; then
    echo -e "   ${YELLOW}⚠️  Symlink points to: $LINK_TARGET${NC}"
    echo "   Expected: $CONFIG_FILE"
    WARNINGS=$((WARNINGS + 1))
  fi
elif [ -f "$ENABLED_LINK" ]; then
  echo -e "${YELLOW}⚠️${NC}"
  echo "   Regular file (not symlink): $ENABLED_LINK"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${RED}✗${NC}"
  echo "   Symlink not found: $ENABLED_LINK"
  ERRORS=$((ERRORS + 1))
fi

# Check 3: Nginx syntax validation
echo -n "3. Nginx syntax validation... "
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo "   Run: sudo nginx -t"
  ERRORS=$((ERRORS + 1))
fi

# Check 4: Nginx is running
echo -n "4. Nginx service is running... "
if systemctl is-active --quiet nginx 2>/dev/null; then
  echo -e "${GREEN}✓${NC}"
elif pgrep nginx > /dev/null; then
  echo -e "${YELLOW}⚠️${NC}"
  echo "   Nginx is running but not via systemd"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${RED}✗${NC}"
  echo "   Nginx is not running"
  echo "   Run: sudo systemctl start nginx"
  ERRORS=$((ERRORS + 1))
fi

# Check 5: Active backend port detection
echo -n "5. Active backend port... "
if [ -f "$CONFIG_FILE" ]; then
  ACTIVE_PORT=$(grep -oP 'server\s+localhost:\K\d+' "$CONFIG_FILE" | head -1)
  if [ "$ACTIVE_PORT" == "$BLUE_PORT" ]; then
    echo -e "${GREEN}✓ (Blue: $BLUE_PORT)${NC}"
  elif [ "$ACTIVE_PORT" == "$GREEN_PORT" ]; then
    echo -e "${GREEN}✓ (Green: $GREEN_PORT)${NC}"
  else
    echo -e "${YELLOW}⚠️ (Port: $ACTIVE_PORT)${NC}"
    echo "   Expected: $BLUE_PORT or $GREEN_PORT"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}✗${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check 5b: Active frontend directory detection
echo -n "5b. Active frontend directory... "
if [ -f "$CONFIG_FILE" ]; then
  ACTIVE_FRONTEND=$(grep -oP 'root\s+\K/var/www/weatherman/\w+' "$CONFIG_FILE" | head -1)
  if [ "$ACTIVE_FRONTEND" == "/var/www/weatherman/blue" ]; then
    echo -e "${GREEN}✓ (Blue)${NC}"
  elif [ "$ACTIVE_FRONTEND" == "/var/www/weatherman/green" ]; then
    echo -e "${GREEN}✓ (Green)${NC}"
  else
    echo -e "${YELLOW}⚠️ (Dir: $ACTIVE_FRONTEND)${NC}"
    echo "   Expected: /var/www/weatherman/blue or /var/www/weatherman/green"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${RED}✗${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check 6: Server name configuration
echo -n "6. Server name configured... "
if [ -f "$CONFIG_FILE" ]; then
  SERVER_NAME=$(grep -oP 'server_name\s+\K[^;]+' "$CONFIG_FILE" | head -1)
  if [ -n "$SERVER_NAME" ]; then
    echo -e "${GREEN}✓ ($SERVER_NAME)${NC}"
    if [ "$SERVER_NAME" == "weatherman.zwarg.com" ]; then
      echo -e "   ${YELLOW}⚠️  Using example domain (update for production)${NC}"
      WARNINGS=$((WARNINGS + 1))
    fi
  else
    echo -e "${RED}✗${NC}"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo -e "${RED}✗${NC}"
  ERRORS=$((ERRORS + 1))
fi

# Check 7: Log files exist and are writable
echo -n "7. Log directory exists... "
if [ -d "/var/log/nginx" ]; then
  echo -e "${GREEN}✓${NC}"

  # Check if logs exist
  if [ -f "/var/log/nginx/weatherman-access.log" ] || [ -f "/var/log/nginx/weatherman-error.log" ]; then
    echo "   Log files exist"
  else
    echo -e "   ${YELLOW}⚠️  Log files will be created on first request${NC}"
  fi
else
  echo -e "${RED}✗${NC}"
  echo "   Directory not found: /var/log/nginx"
  ERRORS=$((ERRORS + 1))
fi

# Check 8: Blue environment port availability
echo -n "8. Blue port ($BLUE_PORT) check... "
if lsof -i ":$BLUE_PORT" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ (process listening)${NC}"
else
  echo -e "${YELLOW}⚠️ (no process listening)${NC}"
  echo "   Blue environment not running"
  echo "   Run: ./scripts/deployment/deploy-to-blue.sh"
  WARNINGS=$((WARNINGS + 1))
fi

# Check 9: Green environment port availability
echo -n "9. Green port ($GREEN_PORT) check... "
if lsof -i ":$GREEN_PORT" > /dev/null 2>&1; then
  echo -e "${GREEN}✓ (process listening)${NC}"
  echo "   Both environments running (unusual)"
else
  echo -e "${BLUE}○ (inactive)${NC}"
  echo "   Green environment not running (expected)"
fi

# Check 10: HTTP connectivity test
echo -n "10. HTTP connectivity test... "
if systemctl is-active --quiet nginx 2>/dev/null || pgrep nginx > /dev/null; then
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✓ (HTTP 200)${NC}"
  elif [ "$HTTP_CODE" == "502" ]; then
    echo -e "${YELLOW}⚠️ (HTTP 502 Bad Gateway)${NC}"
    echo "   Backend not responding (app not running?)"
    WARNINGS=$((WARNINGS + 1))
  elif [ "$HTTP_CODE" == "000" ]; then
    echo -e "${RED}✗ (Connection failed)${NC}"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${YELLOW}⚠️ (HTTP $HTTP_CODE)${NC}"
    WARNINGS=$((WARNINGS + 1))
  fi
else
  echo -e "${YELLOW}⚠️ (Nginx not running)${NC}"
  WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "═══════════════════════════════════════════════"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All checks passed!${NC}"
  EXIT_CODE=0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Configuration OK with $WARNINGS warning(s)${NC}"
  EXIT_CODE=0
else
  echo -e "${RED}❌ Configuration has $ERRORS error(s) and $WARNINGS warning(s)${NC}"
  EXIT_CODE=1
fi
echo "═══════════════════════════════════════════════"
echo ""

# Recommendations
if [ $ERRORS -gt 0 ] || [ $WARNINGS -gt 0 ]; then
  echo "📋 Recommendations:"
  echo ""

  if [ ! -f "$CONFIG_FILE" ]; then
    echo "   • Install nginx configuration:"
    echo "     sudo ./scripts/deployment/install-nginx-config.sh"
    echo ""
  fi

  if ! systemctl is-active --quiet nginx 2>/dev/null && ! pgrep nginx > /dev/null; then
    echo "   • Start nginx service:"
    echo "     sudo systemctl start nginx"
    echo ""
  fi

  if ! lsof -i ":$BLUE_PORT" > /dev/null 2>&1; then
    echo "   • Start Blue environment:"
    echo "     ./scripts/deployment/deploy-to-blue.sh"
    echo ""
  fi

  if [ -f "$CONFIG_FILE" ]; then
    SERVER_NAME=$(grep -oP 'server_name\s+\K[^;]+' "$CONFIG_FILE" | head -1)
    if [ "$SERVER_NAME" == "weatherman.zwarg.com" ]; then
      echo "   • Update server name for production:"
      echo "     sudo nano $CONFIG_FILE"
      echo "     sudo nginx -t && sudo systemctl reload nginx"
      echo ""
    fi
  fi
fi

# Useful commands
echo "🔧 Useful Commands:"
echo "   View nginx config:     sudo cat $CONFIG_FILE"
echo "   Test nginx syntax:     sudo nginx -t"
echo "   Reload nginx:          sudo systemctl reload nginx"
echo "   View access logs:      sudo tail -f /var/log/nginx/weatherman-access.log"
echo "   View error logs:       sudo tail -f /var/log/nginx/weatherman-error.log"
echo "   Check active env:      curl http://localhost/health"
echo "   Deploy to Blue:        ./scripts/deployment/deploy-to-blue.sh"
echo "   Switch to Green:       ./scripts/deployment/switch-traffic.sh green"
echo ""

exit $EXIT_CODE
