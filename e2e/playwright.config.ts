import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const rawBaseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 60_000,
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  reporter: [['html', { open: 'never' }], ['github'], ['json', { outputFile: 'test-results/results.json' }]],
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        storageState: { cookies: [], origins: [] },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 375, height: 812 },
        storageState: { cookies: [], origins: [] },
      },
    },
  ],
});
