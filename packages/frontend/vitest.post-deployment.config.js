/**
 * Vitest configuration for post-deployment tests
 *
 * This minimal config is used for running post-deployment tests that are
 * excluded from the main vitest.config.js. It has no exclude rules so that
 * post-deployment tests can be executed.
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    // No exclude rules - allow all tests to run
  },
});
