import 'dotenv/config';
import { chromium } from '@playwright/test';
import { LoginPage } from './pages/auth/login.page';
import { writeStorageState } from './helpers/storage-state.helper';

interface UserConfig {
  username: string;
  password: string;
  storagePath: string;
}

async function globalSetup(): Promise<void> {
  const rawBaseURL = process.env['E2E_BASE_URL'] ?? 'http://localhost:4200';
  const baseURL = rawBaseURL.endsWith('/') ? rawBaseURL : `${rawBaseURL}/`;

  const users: UserConfig[] = [
    {
      username: process.env['E2E_DEMO_USERNAME'] ?? 'demo@breadly.app',
      password: process.env['E2E_DEMO_PASSWORD'] ?? '',
      storagePath: '.auth/user.json',
    },
    {
      username: process.env['E2E_ADMIN_USERNAME'] ?? 'admin@breadly.app',
      password: process.env['E2E_ADMIN_PASSWORD'] ?? '',
      storagePath: '.auth/admin.json',
    },
  ];

  const browser = await chromium.launch();

  try {
    for (const user of users) {
      if (!user.password) {
        console.warn(
          `Password not set for ${user.username} — skipping. ` +
            'Tests requiring this user will fail.',
        );
        continue;
      }

      console.log(`Authenticating ${user.username} via Cognito Hosted UI…`);

      const context = await browser.newContext();
      const page = await context.newPage();

      // Navigate to a protected route — the app will redirect to the Cognito Hosted UI
      await page.goto(`${baseURL}recipes`, { waitUntil: 'domcontentloaded' });

      // Fill credentials and submit via the shared page object
      const loginPage = new LoginPage(page);
      await loginPage.fillCognitoCredentials(user.username, user.password, { timeout: 60_000 });

      // Wait for the OIDC callback to complete and the app to redirect to /recipes
      await page.waitForURL('**/recipes**', { timeout: 30_000 });

      // Extract all localStorage entries — these contain the real tokens
      // set by angular-oauth2-oidc after the OIDC callback
      const localStorage = await page.evaluate(() => {
        const entries: { name: string; value: string }[] = [];
        for (let i = 0; i < window.localStorage.length; i++) {
          const key = window.localStorage.key(i)!;
          entries.push({ name: key, value: window.localStorage.getItem(key)! });
        }
        return entries;
      });

      const origin = new URL(baseURL).origin;
      const storageState = {
        cookies: [] as never[],
        origins: [{ origin, localStorage }],
      };

      writeStorageState(storageState, user.storagePath);
      console.log(`Saved storage state for ${user.username} → ${user.storagePath}`);

      await context.close();
    }
  } finally {
    await browser.close();
  }
}

export default globalSetup;
