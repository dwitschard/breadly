import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

const rawBaseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

const isLocalhost = new URL(baseURL).hostname === 'localhost';

const webServer = isLocalhost
  ? [
      {
        command: 'npm --prefix ../breadly-backend run dev',
        url: 'http://localhost:3000/api/health',
        timeout: 120_000,
        reuseExistingServer: !process.env['CI'],
        stdout: 'pipe' as const,
      },
      {
        command: 'npm --prefix ../breadly-frontend run serve',
        url: 'http://localhost:4200',
        timeout: 120_000,
        reuseExistingServer: !process.env['CI'],
        stdout: 'pipe' as const,
      },
    ]
  : undefined;

export default defineConfig({
  webServer,
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
    trace: 'retain-on-failure',
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
