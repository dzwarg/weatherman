/**
 * Test setup file
 * Runs before all tests
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Setup code that runs before all tests
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.WEATHER_API_KEY = 'test_api_key';
  process.env.WEATHER_API_URL = 'https://api.openweathermap.org/data/2.5';
});

// Cleanup code that runs after each test
afterEach(() => {
  // Clear any mocks or spies
});

// Cleanup code that runs after all tests
afterAll(() => {
  // Final cleanup
});
