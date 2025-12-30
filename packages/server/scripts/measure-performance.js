#!/usr/bin/env node
/**
 * Performance measurement script for server API endpoints
 * Measures response times for weather proxy and recommendations
 */

import { performance } from 'perf_hooks';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const ITERATIONS = parseInt(process.env.ITERATIONS) || 10;

// Test data
const testLocation = { lat: 42.3601, lon: -71.0589 };
const testProfile = {
  id: '7yo-boy',
  age: 7,
  gender: 'boy',
};
const testWeather = {
  temperature: 65,
  feelsLike: 63,
  conditions: 'Clear',
  precipitationProbability: 10,
  windSpeed: 8,
  uvIndex: 5,
};

/**
 * Measure response time for a single request
 */
async function measureRequest(url, options = {}) {
  const start = performance.now();

  try {
    const response = await fetch(url, options);
    const end = performance.now();
    const duration = end - start;

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    await response.json(); // Parse to ensure complete response
    return { duration, success: true, status: response.status };
  } catch (error) {
    const end = performance.now();
    const duration = end - start;
    return { duration, success: false, error: error.message };
  }
}

/**
 * Run multiple iterations and calculate statistics
 */
async function runBenchmark(name, url, options = {}) {
  console.log(`\n📊 Benchmarking: ${name}`);
  console.log(`   Iterations: ${ITERATIONS}`);

  const results = [];

  for (let i = 0; i < ITERATIONS; i++) {
    const result = await measureRequest(url, options);
    results.push(result);

    if (result.success) {
      process.stdout.write('.');
    } else {
      process.stdout.write('X');
    }
  }

  console.log('\n');

  // Calculate statistics
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  if (successful.length === 0) {
    console.log(`❌ All requests failed`);
    if (failed.length > 0) {
      console.log(`   Error: ${failed[0].error}`);
    }
    return null;
  }

  const durations = successful.map((r) => r.duration);
  const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  const sorted = [...durations].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  console.log(`✅ Results:`);
  console.log(`   Success rate: ${successful.length}/${results.length} (${Math.round((successful.length / results.length) * 100)}%)`);
  console.log(`   Average: ${avg.toFixed(2)}ms`);
  console.log(`   Median: ${median.toFixed(2)}ms`);
  console.log(`   Min: ${min.toFixed(2)}ms`);
  console.log(`   Max: ${max.toFixed(2)}ms`);
  console.log(`   P95: ${p95.toFixed(2)}ms`);

  return { name, avg, median, min, max, p95, successRate: successful.length / results.length };
}

/**
 * Main benchmark runner
 */
async function main() {
  console.log('🚀 Server Performance Measurement');
  console.log(`   API Base URL: ${API_BASE_URL}`);
  console.log(`   Iterations: ${ITERATIONS}`);

  const benchmarks = [];

  // 1. Health Check
  const healthResult = await runBenchmark('Health Check', `${API_BASE_URL}/api/health`);
  if (healthResult) benchmarks.push(healthResult);

  // 2. Weather Proxy (Current)
  const weatherResult = await runBenchmark(
    'Weather Proxy (Current)',
    `${API_BASE_URL}/api/weather/current`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testLocation),
    }
  );
  if (weatherResult) benchmarks.push(weatherResult);

  // 3. Recommendations
  const recommendationsResult = await runBenchmark(
    'Recommendations (with Claude)',
    `${API_BASE_URL}/api/recommendations`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: testProfile,
        weather: testWeather,
        prompt: 'What should I wear to school?',
      }),
    }
  );
  if (recommendationsResult) benchmarks.push(recommendationsResult);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📈 PERFORMANCE SUMMARY');
  console.log('='.repeat(60));

  benchmarks.forEach((b) => {
    const status = b.avg < 100 ? '🟢' : b.avg < 500 ? '🟡' : '🔴';
    console.log(`\n${status} ${b.name}`);
    console.log(`   Average: ${b.avg.toFixed(2)}ms`);
    console.log(`   Median: ${b.median.toFixed(2)}ms`);
    console.log(`   P95: ${b.p95.toFixed(2)}ms`);
    console.log(`   Success Rate: ${(b.successRate * 100).toFixed(1)}%`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Performance measurement complete\n');
}

main().catch((error) => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
