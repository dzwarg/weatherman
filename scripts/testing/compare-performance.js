#!/usr/bin/env node
/**
 * Performance Comparison Script
 *
 * This script compares performance metrics between two environments
 * and provides informational output. It only fails for truly concerning
 * regressions (>20% AND >50ms absolute increase).
 *
 * Usage:
 *   node compare-performance.js <baseline_file> <new_file>
 *   ./compare-performance.js <baseline_file> <new_file>
 *
 * Example:
 *   node compare-performance.js baseline-blue.json baseline-green.json
 *
 * Exit Codes:
 *   0 - Performance is acceptable
 *   1 - Significant performance regression detected
 *   2 - Invalid input or missing files
 *
 * T047: Performance comparison script with smart threshold check
 */

import { readFileSync, existsSync } from 'fs';

// Configuration
const THRESHOLD_PERCENT = 20;
const FAST_RESPONSE_THRESHOLD_MS = 50; // Responses under 50ms are always considered good
const ABSOLUTE_INCREASE_THRESHOLD_MS = 50; // Must increase by >50ms to be concerning

// Colors for output
const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  reset: '\x1b[0m',
};

// Parse command line arguments
const [, , baselineFile, newFile] = process.argv;

// Validate input
if (!baselineFile || !newFile) {
  console.error('Error: Missing required arguments');
  console.error('Usage: node compare-performance.js <baseline_file> <new_file>');
  process.exit(2);
}

if (!existsSync(baselineFile)) {
  console.error(`Error: Baseline file not found: ${baselineFile}`);
  process.exit(2);
}

if (!existsSync(newFile)) {
  console.error(`Error: New baseline file not found: ${newFile}`);
  process.exit(2);
}

// Load JSON files
let baseline, newData;
try {
  baseline = JSON.parse(readFileSync(baselineFile, 'utf8'));
  newData = JSON.parse(readFileSync(newFile, 'utf8'));
} catch (error) {
  console.error(`Error: Failed to parse JSON files: ${error.message}`);
  process.exit(2);
}

console.log('📊 Performance Comparison');
console.log('=========================');
console.log(`Baseline: ${baselineFile}`);
console.log(`New:      ${newFile}`);
console.log(`Threshold: ${THRESHOLD_PERCENT}% AND >${ABSOLUTE_INCREASE_THRESHOLD_MS}ms absolute increase`);
console.log(`Fast response threshold: <${FAST_RESPONSE_THRESHOLD_MS}ms (always considered good)`);
console.log('');

console.log(`Comparing: ${baseline.environment} → ${newData.environment}`);
console.log('');

// Helper function to calculate percentage change
function calculateChange(baselineValue, newValue) {
  // Calculate percentage change: ((new - baseline) / baseline) * 100
  const change = ((newValue - baselineValue) / baselineValue) * 100;
  return change;
}

// Helper function to check if regression is concerning
// Only flag as concerning if BOTH conditions are true:
// 1. Percentage increase > threshold (20%)
// 2. Absolute increase > 50ms (or new value > 50ms if baseline was also slow)
function isConcerningRegression(baselineValue, newValue, percentChange) {
  // If new response time is under 50ms, it's always good regardless of percentage
  if (newValue < FAST_RESPONSE_THRESHOLD_MS) {
    return false;
  }

  // Check if both percentage threshold AND absolute increase threshold are exceeded
  const absoluteIncrease = newValue - baselineValue;
  return percentChange > THRESHOLD_PERCENT && absoluteIncrease > ABSOLUTE_INCREASE_THRESHOLD_MS;
}

// Track overall regression status
let regressionDetected = false;

// Compare metrics for each endpoint
function compareEndpoint(endpointName, metrics) {
  console.log(`📌 ${endpointName}`);
  console.log('─────────────────────────────────────');

  // Extract metrics
  const baselineAvg = metrics.baseline.avg_ms;
  const newAvg = metrics.new.avg_ms;

  const baselineP95 = metrics.baseline.p95_ms;
  const newP95 = metrics.new.p95_ms;

  // Calculate changes
  const avgChange = calculateChange(baselineAvg, newAvg);
  const p95Change = calculateChange(baselineP95, newP95);

  // Display results
  console.log('Average response time:');
  console.log(`  Baseline: ${baselineAvg}ms`);
  console.log(`  New:      ${newAvg}ms`);

  const avgAbsoluteIncrease = newAvg - baselineAvg;
  const avgColor = avgChange > 0 ? colors.red : colors.green;
  const avgSign = avgChange > 0 ? '+' : '';
  const avgIsConcerning = isConcerningRegression(baselineAvg, newAvg, avgChange);

  let avgStatus;
  if (avgIsConcerning) {
    avgStatus = `${colors.red}✗ CONCERNING REGRESSION${colors.reset}`;
  } else if (newAvg < FAST_RESPONSE_THRESHOLD_MS) {
    avgStatus = `${colors.green}✓ Fast response${colors.reset}`;
  } else if (avgChange > THRESHOLD_PERCENT) {
    avgStatus = `${colors.yellow}⚠ Minor increase (not concerning)${colors.reset}`;
  } else {
    avgStatus = `${colors.green}✓${colors.reset}`;
  }

  console.log(
    `  Change:   ${avgColor}${avgSign}${avgChange.toFixed(2)}% (${avgSign}${avgAbsoluteIncrease.toFixed(0)}ms)${colors.reset} ${avgStatus}`
  );

  if (avgIsConcerning) {
    regressionDetected = true;
  }

  console.log('');
  console.log('P95 response time:');
  console.log(`  Baseline: ${baselineP95}ms`);
  console.log(`  New:      ${newP95}ms`);

  const p95AbsoluteIncrease = newP95 - baselineP95;
  const p95Color = p95Change > 0 ? colors.red : colors.green;
  const p95Sign = p95Change > 0 ? '+' : '';
  const p95IsConcerning = isConcerningRegression(baselineP95, newP95, p95Change);

  let p95Status;
  if (p95IsConcerning) {
    p95Status = `${colors.red}✗ CONCERNING REGRESSION${colors.reset}`;
  } else if (newP95 < FAST_RESPONSE_THRESHOLD_MS) {
    p95Status = `${colors.green}✓ Fast response${colors.reset}`;
  } else if (p95Change > THRESHOLD_PERCENT) {
    p95Status = `${colors.yellow}⚠ Minor increase (not concerning)${colors.reset}`;
  } else {
    p95Status = `${colors.green}✓${colors.reset}`;
  }

  console.log(
    `  Change:   ${p95Color}${p95Sign}${p95Change.toFixed(2)}% (${p95Sign}${p95AbsoluteIncrease.toFixed(0)}ms)${colors.reset} ${p95Status}`
  );

  if (p95IsConcerning) {
    regressionDetected = true;
  }

  console.log('');
}

// Compare all endpoints
compareEndpoint('Health Endpoint', {
  baseline: baseline.metrics.health_endpoint,
  new: newData.metrics.health_endpoint,
});

compareEndpoint('Frontend Homepage', {
  baseline: baseline.metrics.homepage,
  new: newData.metrics.homepage,
});

compareEndpoint('Weather Recommendations', {
  baseline: baseline.metrics.recommendations_endpoint,
  new: newData.metrics.recommendations_endpoint,
});

// Print summary
console.log('═══════════════════════════════════════');
console.log('Summary');
console.log('═══════════════════════════════════════');

if (regressionDetected) {
  console.log(
    `${colors.red}❌ Concerning performance regression detected${colors.reset}`
  );
  console.log('');
  console.log('The new environment shows significant performance degradation:');
  console.log(`  - Regression exceeds ${THRESHOLD_PERCENT}% AND ${ABSOLUTE_INCREASE_THRESHOLD_MS}ms absolute increase`);
  console.log('');
  console.log('This deployment should not proceed to traffic switch.');
  console.log('');
  console.log('Possible actions:');
  console.log('  1. Investigate performance bottlenecks');
  console.log('  2. Roll back deployment');
  console.log('  3. Scale up resources');
  console.log('  4. Review if the degradation is acceptable for the given change');
  process.exit(1);
} else {
  console.log(`${colors.green}✅ Performance is acceptable${colors.reset}`);
  console.log('');
  console.log('Performance metrics are within acceptable thresholds:');
  console.log(`  - All fast responses (<${FAST_RESPONSE_THRESHOLD_MS}ms) remain fast`);
  console.log(`  - No concerning regressions (>${THRESHOLD_PERCENT}% AND >${ABSOLUTE_INCREASE_THRESHOLD_MS}ms)`);
  console.log('');
  console.log('Safe to proceed with traffic switch.');
  process.exit(0);
}
