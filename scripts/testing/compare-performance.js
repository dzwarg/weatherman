#!/usr/bin/env node
/**
 * Performance Comparison Script
 *
 * This script compares performance metrics between two environments
 * and fails if the new environment shows >20% performance regression.
 *
 * Usage:
 *   node compare-performance.js <baseline_file> <new_file>
 *   ./compare-performance.js <baseline_file> <new_file>
 *
 * Example:
 *   node compare-performance.js baseline-blue.json baseline-green.json
 *
 * Exit Codes:
 *   0 - Performance is acceptable (< 20% regression)
 *   1 - Performance regression > 20% detected
 *   2 - Invalid input or missing files
 *
 * T047: Performance comparison script with 20% threshold check
 */

import { readFileSync, existsSync } from 'fs';

// Configuration
const THRESHOLD_PERCENT = 20;

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
console.log(`Threshold: ${THRESHOLD_PERCENT}%`);
console.log('');

console.log(`Comparing: ${baseline.environment} → ${newData.environment}`);
console.log('');

// Helper function to calculate percentage change
function calculateChange(baselineValue, newValue) {
  // Calculate percentage change: ((new - baseline) / baseline) * 100
  const change = ((newValue - baselineValue) / baselineValue) * 100;
  return change;
}

// Helper function to check if regression exceeds threshold
function checkThreshold(change, threshold) {
  return change > threshold;
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

  const avgColor = avgChange > 0 ? colors.red : colors.green;
  const avgSign = avgChange > 0 ? '+' : '';
  const avgExceedsThreshold = checkThreshold(avgChange, THRESHOLD_PERCENT);
  const avgStatus = avgExceedsThreshold
    ? `${colors.red}✗ REGRESSION DETECTED${colors.reset}`
    : `${colors.green}✓${colors.reset}`;

  console.log(
    `  Change:   ${avgColor}${avgSign}${avgChange.toFixed(2)}%${colors.reset} ${avgStatus}`
  );

  if (avgExceedsThreshold) {
    regressionDetected = true;
  }

  console.log('');
  console.log('P95 response time:');
  console.log(`  Baseline: ${baselineP95}ms`);
  console.log(`  New:      ${newP95}ms`);

  const p95Color = p95Change > 0 ? colors.red : colors.green;
  const p95Sign = p95Change > 0 ? '+' : '';
  const p95ExceedsThreshold = checkThreshold(p95Change, THRESHOLD_PERCENT);
  const p95Status = p95ExceedsThreshold
    ? `${colors.red}✗ REGRESSION DETECTED${colors.reset}`
    : `${colors.green}✓${colors.reset}`;

  console.log(
    `  Change:   ${p95Color}${p95Sign}${p95Change.toFixed(2)}%${colors.reset} ${p95Status}`
  );

  if (p95ExceedsThreshold) {
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
    `${colors.red}❌ Performance regression detected (>${THRESHOLD_PERCENT}%)${colors.reset}`
  );
  console.log('');
  console.log('The new environment shows significant performance degradation.');
  console.log('This deployment should not proceed to traffic switch.');
  console.log('');
  console.log('Possible actions:');
  console.log('  1. Investigate performance bottlenecks');
  console.log('  2. Roll back deployment');
  console.log('  3. Scale up resources');
  process.exit(1);
} else {
  console.log(`${colors.green}✅ Performance is acceptable${colors.reset}`);
  console.log('');
  console.log('All performance metrics are within acceptable thresholds.');
  console.log('Safe to proceed with traffic switch.');
  process.exit(0);
}
