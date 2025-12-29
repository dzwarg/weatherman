import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E tests against PRODUCTION build
 * Tests Service Worker, PWA manifest, and offline functionality with real SW
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.test.js',

  // Maximum time one test can run for
  timeout: 30000,

  // Run tests in files in parallel
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: 'html',

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    // Preview server runs on port 4173 with HTTPS (basicSSL plugin)
    baseURL: 'https://localhost:4173',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Ignore HTTPS errors for local development
    ignoreHTTPSErrors: true,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local servers before starting the tests
  webServer: [
    {
      // Mock API server (no real weather/AI dependencies)
      command: 'node scripts/mock-api-server.js',
      url: 'http://localhost:3000/api/health',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      // Frontend preview server (production build with HTTPS)
      command: 'npm run preview',
      url: 'https://localhost:4173',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      ignoreHTTPSErrors: true,
    },
  ],
});
