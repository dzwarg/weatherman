#!/bin/bash
#
# Post-Deployment Test Orchestration Script
#
# This script orchestrates all post-deployment validation tests:
#   1. Smoke tests (quick health checks)
#   2. Frontend integration tests
#   3. Backend integration tests
#   4. Performance baseline capture
#   5. Performance comparison (if baseline exists)
#
# Usage:
#   ./scripts/testing/run-post-deployment-tests.sh <environment> <port>
#
# Example:
#   ./scripts/testing/run-post-deployment-tests.sh green 3002
#
# Exit Codes:
#   0 - All tests passed
#   1 - One or more tests failed
#
# T048: Post-deployment test orchestration script

set -e

# Configuration
ENVIRONMENT="${1:-green}"
PORT="${2:-3002}"
BASE_URL="http://localhost:$PORT"
ACTIVE_ENV="${3:-blue}"  # The currently active environment for baseline comparison
ACTIVE_PORT="${4:-3001}"

# Test results directory
RESULTS_DIR="/tmp/post-deployment-tests-$ENVIRONMENT-$(date +%s)"
mkdir -p "$RESULTS_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test tracking
TOTAL_PHASES=0
PASSED_PHASES=0
FAILED_PHASES=0

START_TIME=$(date +%s)

echo "🧪 Post-Deployment Test Suite"
echo "==============================="
echo "Environment: $ENVIRONMENT (port $PORT)"
echo "Base URL: $BASE_URL"
echo "Results directory: $RESULTS_DIR"
echo ""

# Helper function to run a test phase
run_phase() {
  local phase_name="$1"
  local phase_command="$2"
  local phase_required="${3:-true}"  # Whether failure should stop execution

  TOTAL_PHASES=$((TOTAL_PHASES + 1))

  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}Phase $TOTAL_PHASES: $phase_name${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  local phase_start=$(date +%s)

  if eval "$phase_command" > "$RESULTS_DIR/phase-$TOTAL_PHASES.log" 2>&1; then
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))

    echo -e "${GREEN}✅ PASSED${NC} (${phase_duration}s)"
    PASSED_PHASES=$((PASSED_PHASES + 1))

    # Show summary from log
    tail -5 "$RESULTS_DIR/phase-$TOTAL_PHASES.log"

    return 0
  else
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - phase_start))

    echo -e "${RED}❌ FAILED${NC} (${phase_duration}s)"
    FAILED_PHASES=$((FAILED_PHASES + 1))

    # Show error from log
    echo -e "${YELLOW}Last 20 lines of output:${NC}"
    tail -20 "$RESULTS_DIR/phase-$TOTAL_PHASES.log"

    if [ "$phase_required" = "true" ]; then
      echo ""
      echo -e "${RED}This is a required phase. Stopping test execution.${NC}"
      return 1
    fi

    return 0
  fi
}

# Phase 1: Smoke Tests (30 seconds)
run_phase "Smoke Tests" \
  "bash scripts/testing/smoke-tests.sh $ENVIRONMENT $PORT" \
  "true" || exit 1

# Phase 2: Frontend Post-Deployment Tests
# Note: Use dedicated config file without exclude rules
run_phase "Frontend Integration Tests" \
  "(cd packages/frontend && BASE_URL=$BASE_URL npx vitest run tests/post-deployment/smoke.test.js --no-coverage --config=vitest.post-deployment.config.js)" \
  "true" || exit 1

# Phase 3: Backend Post-Deployment Tests
# Note: Use dedicated config file without exclude rules
run_phase "Backend Integration Tests" \
  "(cd packages/server && BASE_URL=$BASE_URL npx vitest run tests/post-deployment/integration.test.js --no-coverage --config=vitest.post-deployment.config.js)" \
  "true" || exit 1

# Phase 4: Performance Baseline Capture
run_phase "Performance Baseline Capture" \
  "bash scripts/testing/performance-baseline.sh $ENVIRONMENT $PORT $RESULTS_DIR/baseline-$ENVIRONMENT.json" \
  "false"  # Performance capture failure is not critical

# Phase 5: Performance Comparison (if active environment baseline exists)
ACTIVE_BASELINE="/tmp/performance-baseline-$ACTIVE_ENV.json"
NEW_BASELINE="$RESULTS_DIR/baseline-$ENVIRONMENT.json"

if [ -f "$NEW_BASELINE" ]; then
  # Try to capture active environment baseline if it doesn't exist
  if [ ! -f "$ACTIVE_BASELINE" ]; then
    echo ""
    echo "📊 Capturing baseline from active environment ($ACTIVE_ENV) for comparison..."
    bash scripts/testing/performance-baseline.sh "$ACTIVE_ENV" "$ACTIVE_PORT" "$ACTIVE_BASELINE" || true
  fi

  # Compare if we have both baselines
  if [ -f "$ACTIVE_BASELINE" ]; then
    run_phase "Performance Comparison (20% threshold)" \
      "bash scripts/testing/compare-performance.sh $ACTIVE_BASELINE $NEW_BASELINE" \
      "true" || exit 1  # Performance regression should fail deployment
  else
    echo ""
    echo -e "${YELLOW}⚠️  Skipping performance comparison - no baseline for active environment${NC}"
  fi
else
  echo ""
  echo -e "${YELLOW}⚠️  Skipping performance comparison - baseline capture failed${NC}"
fi

# Calculate final statistics
END_TIME=$(date +%s)
TOTAL_DURATION=$((END_TIME - START_TIME))
MINUTES=$((TOTAL_DURATION / 60))
SECONDS=$((TOTAL_DURATION % 60))

# Print final summary
echo ""
echo "═══════════════════════════════════════"
echo "📊 Test Suite Summary"
echo "═══════════════════════════════════════"
echo "Environment: $ENVIRONMENT"
echo "Total phases: $TOTAL_PHASES"
echo -e "Passed: ${GREEN}$PASSED_PHASES${NC}"
echo -e "Failed: ${RED}$FAILED_PHASES${NC}"
echo "Duration: ${MINUTES}m ${SECONDS}s"
echo "Results: $RESULTS_DIR"
echo ""

# Exit with appropriate code
if [ $FAILED_PHASES -eq 0 ]; then
  echo -e "${GREEN}✅ All post-deployment tests passed!${NC}"
  echo ""
  echo "The $ENVIRONMENT environment is ready for traffic."
  exit 0
else
  echo -e "${RED}❌ Post-deployment tests failed!${NC}"
  echo ""
  echo "The $ENVIRONMENT environment is NOT ready for traffic."
  echo "Review test logs in: $RESULTS_DIR"
  exit 1
fi
