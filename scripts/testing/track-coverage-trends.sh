#!/bin/bash
# Track coverage trends over time
#
# Purpose: Extract coverage metrics and store as time-series data
# Usage: ./scripts/testing/track-coverage-trends.sh
# Output: coverage-trend.json with historical data

set -e

# Configuration
FRONTEND_COVERAGE_FILE="packages/frontend/coverage/coverage-summary.json"
BACKEND_COVERAGE_FILE="packages/server/coverage/coverage-summary.json"
TREND_FILE="coverage-trend.json"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
RUN_NUMBER="${GITHUB_RUN_NUMBER:-local}"
COMMIT_SHA="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo 'unknown')}"
BRANCH_NAME="${GITHUB_REF_NAME:-$(git branch --show-current 2>/dev/null || echo 'unknown')}"

# Check if coverage files exist
if [ ! -f "$FRONTEND_COVERAGE_FILE" ]; then
    echo "❌ Frontend coverage file not found: $FRONTEND_COVERAGE_FILE"
    echo "Run 'npm test --workspace=packages/frontend' first"
    exit 1
fi

if [ ! -f "$BACKEND_COVERAGE_FILE" ]; then
    echo "❌ Backend coverage file not found: $BACKEND_COVERAGE_FILE"
    echo "Run 'npm test --workspace=packages/server' first"
    exit 1
fi

# Extract coverage metrics
echo "📊 Extracting coverage metrics..."

# Use Node.js to parse JSON (more portable than jq)
node <<'EOF'
const fs = require('fs');

const frontendCoverage = JSON.parse(fs.readFileSync('packages/frontend/coverage/coverage-summary.json', 'utf8'));
const backendCoverage = JSON.parse(fs.readFileSync('packages/server/coverage/coverage-summary.json', 'utf8'));

const trendEntry = {
  timestamp: process.env.TIMESTAMP,
  runNumber: process.env.RUN_NUMBER,
  commit: process.env.COMMIT_SHA,
  branch: process.env.BRANCH_NAME,
  frontend: {
    lines: frontendCoverage.total.lines.pct,
    statements: frontendCoverage.total.statements.pct,
    functions: frontendCoverage.total.functions.pct,
    branches: frontendCoverage.total.branches.pct
  },
  backend: {
    lines: backendCoverage.total.lines.pct,
    statements: backendCoverage.total.statements.pct,
    functions: backendCoverage.total.functions.pct,
    branches: backendCoverage.total.branches.pct
  },
  aggregate: {
    lines: (frontendCoverage.total.lines.pct + backendCoverage.total.lines.pct) / 2,
    statements: (frontendCoverage.total.statements.pct + backendCoverage.total.statements.pct) / 2,
    functions: (frontendCoverage.total.functions.pct + backendCoverage.total.functions.pct) / 2,
    branches: (frontendCoverage.total.branches.pct + backendCoverage.total.branches.pct) / 2
  }
};

// Load existing trend data or create new array
let trendData = [];
if (fs.existsSync(process.env.TREND_FILE)) {
  try {
    trendData = JSON.parse(fs.readFileSync(process.env.TREND_FILE, 'utf8'));
  } catch (err) {
    console.error('⚠️  Error reading trend file, starting fresh:', err.message);
  }
}

// Append new entry
trendData.push(trendEntry);

// Keep only last 100 entries to avoid unbounded growth
if (trendData.length > 100) {
  trendData = trendData.slice(-100);
}

// Write updated trend file
fs.writeFileSync(process.env.TREND_FILE, JSON.stringify(trendData, null, 2));

// Print summary
console.log('\n✅ Coverage trend updated:');
console.log(`   Run: ${trendEntry.runNumber} | Branch: ${trendEntry.branch}`);
console.log(`   Frontend Lines: ${trendEntry.frontend.lines.toFixed(2)}%`);
console.log(`   Backend Lines: ${trendEntry.backend.lines.toFixed(2)}%`);
console.log(`   Aggregate Lines: ${trendEntry.aggregate.lines.toFixed(2)}%`);
console.log(`\n📈 Trend file: ${process.env.TREND_FILE} (${trendData.length} entries)`);
EOF

echo ""
echo "✅ Coverage trend tracking complete"
echo "📁 Trend file: $TREND_FILE"
