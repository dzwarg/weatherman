#!/bin/bash
#
# Performance Comparison Script
#
# This script compares performance metrics between two environments
# and fails if the new environment shows >20% performance regression.
#
# Usage:
#   ./scripts/testing/compare-performance.sh <baseline_file> <new_file>
#
# Example:
#   ./scripts/testing/compare-performance.sh baseline-blue.json baseline-green.json
#
# Exit Codes:
#   0 - Performance is acceptable (< 20% regression)
#   1 - Performance regression > 20% detected
#   2 - Invalid input or missing files
#
# T047: Performance comparison script with 20% threshold check

set -e

# Configuration
BASELINE_FILE="${1}"
NEW_FILE="${2}"
THRESHOLD_PERCENT=20

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validate input
if [ -z "$BASELINE_FILE" ] || [ -z "$NEW_FILE" ]; then
  echo "Error: Missing required arguments"
  echo "Usage: $0 <baseline_file> <new_file>"
  exit 2
fi

if [ ! -f "$BASELINE_FILE" ]; then
  echo "Error: Baseline file not found: $BASELINE_FILE"
  exit 2
fi

if [ ! -f "$NEW_FILE" ]; then
  echo "Error: New baseline file not found: $NEW_FILE"
  exit 2
fi

echo "📊 Performance Comparison"
echo "========================="
echo "Baseline: $BASELINE_FILE"
echo "New:      $NEW_FILE"
echo "Threshold: ${THRESHOLD_PERCENT}%"
echo ""

# Extract environment names
BASELINE_ENV=$(jq -r '.environment' "$BASELINE_FILE")
NEW_ENV=$(jq -r '.environment' "$NEW_FILE")

echo "Comparing: $BASELINE_ENV → $NEW_ENV"
echo ""

# Helper function to calculate percentage change
calculate_change() {
  local baseline=$1
  local new=$2

  # Calculate percentage change: ((new - baseline) / baseline) * 100
  echo "scale=2; (($new - $baseline) / $baseline) * 100" | bc
}

# Helper function to check if regression exceeds threshold
check_threshold() {
  local change=$1
  local threshold=$2

  # Use bc for floating point comparison
  local exceeds=$(echo "$change > $threshold" | bc)
  return $exceeds
}

# Track overall regression status
REGRESSION_DETECTED=0
WARNINGS=0

# Compare metrics for each endpoint
compare_endpoint() {
  local endpoint_name="$1"
  local json_path="$2"

  echo "📌 $endpoint_name"
  echo "─────────────────────────────────────"

  # Extract metrics
  local baseline_avg=$(jq -r "$json_path.avg_ms" "$BASELINE_FILE")
  local new_avg=$(jq -r "$json_path.avg_ms" "$NEW_FILE")

  local baseline_p95=$(jq -r "$json_path.p95_ms" "$BASELINE_FILE")
  local new_p95=$(jq -r "$json_path.p95_ms" "$NEW_FILE")

  # Calculate changes
  local avg_change=$(calculate_change $baseline_avg $new_avg)
  local p95_change=$(calculate_change $baseline_p95 $new_p95)

  # Display results
  echo "Average response time:"
  echo "  Baseline: ${baseline_avg}ms"
  echo "  New:      ${new_avg}ms"

  if (( $(echo "$avg_change > 0" | bc -l) )); then
    echo -ne "  Change:   ${RED}+${avg_change}%${NC}"
  else
    echo -ne "  Change:   ${GREEN}${avg_change}%${NC}"
  fi

  if check_threshold "$avg_change" "$THRESHOLD_PERCENT"; then
    echo -e " ${RED}✗ REGRESSION DETECTED${NC}"
    REGRESSION_DETECTED=1
  else
    echo -e " ${GREEN}✓${NC}"
  fi

  echo ""
  echo "P95 response time:"
  echo "  Baseline: ${baseline_p95}ms"
  echo "  New:      ${new_p95}ms"

  if (( $(echo "$p95_change > 0" | bc -l) )); then
    echo -ne "  Change:   ${RED}+${p95_change}%${NC}"
  else
    echo -ne "  Change:   ${GREEN}${p95_change}%${NC}"
  fi

  if check_threshold "$p95_change" "$THRESHOLD_PERCENT"; then
    echo -e " ${RED}✗ REGRESSION DETECTED${NC}"
    REGRESSION_DETECTED=1
  else
    echo -e " ${GREEN}✓${NC}"
  fi

  echo ""
}

# Compare all endpoints
compare_endpoint "Health Endpoint" ".metrics.health_endpoint"
compare_endpoint "Frontend Homepage" ".metrics.homepage"
compare_endpoint "Weather Recommendations" ".metrics.recommendations_endpoint"

# Print summary
echo "═══════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════"

if [ $REGRESSION_DETECTED -eq 1 ]; then
  echo -e "${RED}❌ Performance regression detected (>${THRESHOLD_PERCENT}%)${NC}"
  echo ""
  echo "The new environment shows significant performance degradation."
  echo "This deployment should not proceed to traffic switch."
  echo ""
  echo "Possible actions:"
  echo "  1. Investigate performance bottlenecks"
  echo "  2. Roll back deployment"
  echo "  3. Scale up resources"
  exit 1
else
  echo -e "${GREEN}✅ Performance is acceptable${NC}"
  echo ""
  echo "All performance metrics are within acceptable thresholds."
  echo "Safe to proceed with traffic switch."
  exit 0
fi
