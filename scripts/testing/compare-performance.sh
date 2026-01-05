#!/bin/bash
#
# Performance Comparison Script (Wrapper)
#
# This script wraps the Node.js implementation to maintain backward compatibility.
# Uses Node.js instead of jq/bc to avoid requiring additional system dependencies.
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

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Call the Node.js implementation
exec node "$SCRIPT_DIR/compare-performance.js" "$@"
