#!/bin/bash
#
# Performance Baseline Capture Script
#
# This script captures performance metrics from an environment
# to establish a baseline for comparison.
#
# Usage:
#   ./scripts/testing/performance-baseline.sh <environment> <port> [output_file]
#
# Example:
#   ./scripts/testing/performance-baseline.sh blue 3001 baseline-blue.json
#
# Exit Codes:
#   0 - Baseline captured successfully
#   1 - Failed to capture baseline
#
# T046: Performance baseline script to capture metrics

set -e

# Configuration
ENVIRONMENT="${1:-blue}"
PORT="${2:-3001}"
OUTPUT_FILE="${3:-/tmp/performance-baseline-$ENVIRONMENT.json}"
BASE_URL="http://localhost:$PORT"

# Number of requests for sampling
SAMPLE_SIZE=10

echo "📊 Capturing Performance Baseline"
echo "=================================="
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo "Sample size: $SAMPLE_SIZE requests"
echo "Output file: $OUTPUT_FILE"
echo ""

# Array to store response times
declare -a RESPONSE_TIMES

# Helper function to measure response time in milliseconds
measure_response_time() {
  local url="$1"
  local response_time

  # Use curl's time metrics to get total time in milliseconds
  response_time=$(curl -sf --max-time 10 -o /dev/null -w '%{time_total}' "$url" 2>/dev/null)

  if [ $? -eq 0 ]; then
    # Convert seconds to milliseconds
    echo "$response_time" | awk '{printf "%.0f", $1 * 1000}'
    return 0
  else
    echo "0"
    return 1
  fi
}

# Capture baseline metrics
echo "Measuring response times..."

# Test 1: Health endpoint
echo -n "Health endpoint: "
HEALTH_TIMES=()
for i in $(seq 1 $SAMPLE_SIZE); do
  TIME=$(measure_response_time "$BASE_URL/api/health")
  HEALTH_TIMES+=($TIME)
  echo -n "."
done
echo " done"

# Test 2: Frontend homepage
echo -n "Frontend homepage: "
HOMEPAGE_TIMES=()
for i in $(seq 1 $SAMPLE_SIZE); do
  TIME=$(measure_response_time "$BASE_URL/")
  HOMEPAGE_TIMES+=($TIME)
  echo -n "."
done
echo " done"

# Test 3: Weather recommendations endpoint (POST with sample data)
echo -n "Weather recommendations: "
RECOMMENDATIONS_TIMES=()
for i in $(seq 1 $SAMPLE_SIZE); do
  TIME=$(curl -sf --max-time 10 \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"location":"Boston","temperature":50,"conditions":"sunny"}' \
    -o /dev/null \
    -w '%{time_total}' \
    "$BASE_URL/api/recommendations" 2>/dev/null | awk '{printf "%.0f", $1 * 1000}')
  RECOMMENDATIONS_TIMES+=($TIME)
  echo -n "."
done
echo " done"

# Calculate statistics
calculate_stats() {
  local -n arr=$1
  local sum=0
  local count=${#arr[@]}
  local min=${arr[0]}
  local max=${arr[0]}

  # Calculate sum, min, max
  for time in "${arr[@]}"; do
    sum=$((sum + time))
    if [ $time -lt $min ]; then min=$time; fi
    if [ $time -gt $max ]; then max=$time; fi
  done

  # Calculate average
  local avg=$((sum / count))

  # Calculate median (sort array and take middle value)
  local sorted=($(printf '%s\n' "${arr[@]}" | sort -n))
  local median_index=$((count / 2))
  local median=${sorted[$median_index]}

  # Calculate p95 (95th percentile) using bash arithmetic
  # Multiply by 95 and divide by 100, rounding down
  local p95_index=$(( (count * 95) / 100 ))
  local p95=${sorted[$p95_index]}

  echo "$avg $median $min $max $p95"
}

# Calculate statistics for each endpoint
HEALTH_STATS=($(calculate_stats HEALTH_TIMES))
HOMEPAGE_STATS=($(calculate_stats HOMEPAGE_TIMES))
RECOMMENDATIONS_STATS=($(calculate_stats RECOMMENDATIONS_TIMES))

echo ""
echo "📈 Performance Metrics"
echo "====================="
echo "Health endpoint:"
echo "  Average: ${HEALTH_STATS[0]}ms"
echo "  Median:  ${HEALTH_STATS[1]}ms"
echo "  Min:     ${HEALTH_STATS[2]}ms"
echo "  Max:     ${HEALTH_STATS[3]}ms"
echo "  P95:     ${HEALTH_STATS[4]}ms"
echo ""
echo "Frontend homepage:"
echo "  Average: ${HOMEPAGE_STATS[0]}ms"
echo "  Median:  ${HOMEPAGE_STATS[1]}ms"
echo "  Min:     ${HOMEPAGE_STATS[2]}ms"
echo "  Max:     ${HOMEPAGE_STATS[3]}ms"
echo "  P95:     ${HOMEPAGE_STATS[4]}ms"
echo ""
echo "Weather recommendations:"
echo "  Average: ${RECOMMENDATIONS_STATS[0]}ms"
echo "  Median:  ${RECOMMENDATIONS_STATS[1]}ms"
echo "  Min:     ${RECOMMENDATIONS_STATS[2]}ms"
echo "  Max:     ${RECOMMENDATIONS_STATS[3]}ms"
echo "  P95:     ${RECOMMENDATIONS_STATS[4]}ms"

# Generate JSON output
cat > "$OUTPUT_FILE" <<EOF
{
  "environment": "$ENVIRONMENT",
  "port": $PORT,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "sample_size": $SAMPLE_SIZE,
  "metrics": {
    "health_endpoint": {
      "avg_ms": ${HEALTH_STATS[0]},
      "median_ms": ${HEALTH_STATS[1]},
      "min_ms": ${HEALTH_STATS[2]},
      "max_ms": ${HEALTH_STATS[3]},
      "p95_ms": ${HEALTH_STATS[4]}
    },
    "homepage": {
      "avg_ms": ${HOMEPAGE_STATS[0]},
      "median_ms": ${HOMEPAGE_STATS[1]},
      "min_ms": ${HOMEPAGE_STATS[2]},
      "max_ms": ${HOMEPAGE_STATS[3]},
      "p95_ms": ${HOMEPAGE_STATS[4]}
    },
    "recommendations_endpoint": {
      "avg_ms": ${RECOMMENDATIONS_STATS[0]},
      "median_ms": ${RECOMMENDATIONS_STATS[1]},
      "min_ms": ${RECOMMENDATIONS_STATS[2]},
      "max_ms": ${RECOMMENDATIONS_STATS[3]},
      "p95_ms": ${RECOMMENDATIONS_STATS[4]}
    }
  }
}
EOF

echo ""
echo "✅ Baseline captured successfully"
echo "Output saved to: $OUTPUT_FILE"
exit 0
