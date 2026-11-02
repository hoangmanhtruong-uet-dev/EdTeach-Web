import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for EdTeach Platform
 * Supports Tier 1 (Feature Coverage), Tier 2 (Boundary & Corner Cases),
 * Tier 3 (Cross-Feature Combinations), and Tier 4 (Real-World Application Scenarios).
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on worker to ensure database/session isolation */
  workers: process.env.CI ? 1 : 2,
  /* Reporter to use */
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['html', { open: 'never', outputFolder: 'test-report' }],
  ],
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Accept insecure certs if any */
    ignoreHTTPSErrors: true,
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Run local dev server before starting the tests */
  webServer: {
    command: 'npm --prefix frontend run dev',
    url: 'http://localhost:3001/api/health',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});
