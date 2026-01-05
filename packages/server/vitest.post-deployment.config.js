/**
 * Vitest configuration for post-deployment tests
 *
 * This minimal config is used for running post-deployment tests that are
 * excluded from the main vitest.config.js. It has no exclude rules so that
 * post-deployment tests can be executed.
 *
 * Uses 'node' environment for real HTTP requests against deployed services.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Explicitly pass through BASE_URL environment variable
    env: {
      BASE_URL: process.env.BASE_URL || 'http://localhost:3002',
    },
    // No exclude rules - allow all tests to run
    // No setupFiles - post-deployment tests don't need test setup
    // No coverage thresholds - these are integration tests
  },
});
