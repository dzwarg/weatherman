/**
 * Vitest configuration for post-deployment tests
 *
 * This minimal config is used for running post-deployment tests that are
 * excluded from the main vitest.config.js. It has no exclude rules so that
 * post-deployment tests can be executed.
 *
 * Uses 'node' environment since post-deployment tests make real HTTP requests
 * using Node.js fetch() and don't need browser simulation.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // No exclude rules - allow all tests to run
    // No setupFiles - post-deployment tests don't need browser mocks
  },
});
