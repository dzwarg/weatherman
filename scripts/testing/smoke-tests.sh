#!/bin/bash
#
# Smoke Tests for Post-Deployment Validation
#
# This script performs quick health checks on a deployed environment
# to verify basic functionality before switching traffic.
#
# Usage:
#   ./scripts/testing/smoke-tests.sh <environment> <port>
#
# Example:
#   ./scripts/testing/smoke-tests.sh green 3002
#
# Exit Codes:
#   0 - All smoke tests passed
#   1 - One or more smoke tests failed
#
# T045: Smoke test script for 30-second health checks

set -e

# Configuration
ENVIRONMENT="${1:-green}"
PORT="${2:-3002}"
BASE_URL="http://localhost:$PORT"
TIMEOUT=30
START_TIME=$(date +%s)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "🧪 Running Smoke Tests"
echo "======================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "Timeout: ${TIMEOUT}s"
echo ""

# Helper function to run a test
run_test() {
  local test_name="$1"
  local test_command="$2"

  TOTAL_TESTS=$((TOTAL_TESTS + 1))
  echo -n "Testing: $test_name ... "

  if eval "$test_command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
    return 0
  else
    echo -e "${RED}✗ FAIL${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    return 1
  fi
}

# Helper function to check elapsed time
check_timeout() {
  local current_time=$(date +%s)
  local elapsed=$((current_time - START_TIME))

  if [ $elapsed -ge $TIMEOUT ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Timeout reached (${elapsed}s)${NC}"
    return 1
  fi
  return 0
}

# Test 1: Health endpoint responds
run_test "Health endpoint" \
  "curl -sf --max-time 5 '$BASE_URL/api/health'"

check_timeout || exit 1

# Test 2: Health endpoint returns valid JSON with status ok
run_test "Health endpoint JSON" \
  "curl -sf --max-time 5 '$BASE_URL/api/health' | grep -q '\"status\".*:.*\"ok\"'"

check_timeout || exit 1

# Test 3: Frontend loads (HTTP 200)
run_test "Frontend loads" \
  "curl -sf --max-time 5 -o /dev/null -w '%{http_code}' '$BASE_URL/' | grep -q '^200$'"

check_timeout || exit 1

# Test 4: API weatherman endpoint exists
run_test "Weather recommendations endpoint" \
  "curl -sf --max-time 5 -o /dev/null -w '%{http_code}' '$BASE_URL/api/recommendations' | grep -qE '^(200|400|405)$'"

check_timeout || exit 1

# Test 5: Static assets are accessible
run_test "Static assets load" \
  "curl -sf --max-time 5 -o /dev/null -w '%{http_code}' '$BASE_URL/favicon.ico' | grep -q '^200$'"

check_timeout || exit 1

# Test 6: CORS headers present for API
run_test "CORS headers configured" \
  "curl -sf --max-time 5 -I '$BASE_URL/api/health' | grep -qi 'access-control-allow-origin'"

check_timeout || exit 1

# Test 7: Content-Type headers correct
run_test "Content-Type headers" \
  "curl -sf --max-time 5 -I '$BASE_URL/api/health' | grep -qi 'content-type.*application/json'"

check_timeout || exit 1

# Calculate final elapsed time
END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Print summary
echo ""
echo "📊 Smoke Test Summary"
echo "====================="
echo "Total tests: $TOTAL_TESTS"
echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
echo "Duration: ${ELAPSED}s / ${TIMEOUT}s"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
  echo -e "${GREEN}✅ All smoke tests passed!${NC}"
  exit 0
else
  echo -e "${RED}❌ Some smoke tests failed!${NC}"
  exit 1
fi
