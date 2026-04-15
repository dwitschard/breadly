import { test as base } from '@playwright/test';
import fs from 'node:fs';
import { NavbarPage } from '../pages/shared/navbar.page';

export const ADMIN_STORAGE_STATE = '.auth/admin.json' as const;

export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: [
    async ({ page }, use) => {
      const userPath = '.auth/user.json';
      const adminPath = ADMIN_STORAGE_STATE;

      if (!fs.existsSync(userPath)) {
        throw new Error(
          `No storageState found at ${userPath} — did globalSetup run? ` +
            'Set E2E_COGNITO_CLIENT_ID and E2E_DEMO_PASSWORD env vars.',
        );
      }
      if (!fs.existsSync(adminPath)) {
        console.warn(
          `No storageState found at ${adminPath} — ` +
            'admin tests will fail. Set E2E_ADMIN_PASSWORD to enable.',
        );
      }

      await use();

      // After each test: log out if the user is still signed in.
      // This ensures every subsequent test starts with a clean session.
      // Wrapped in try/catch so teardown errors never mask real test failures.
      try {
        const profileTrigger = page.getByTestId('nav-profile-trigger');
        const isLoggedIn = await profileTrigger.isVisible().catch(() => false);
        if (isLoggedIn) {
          const navbar = new NavbarPage(page);
          await navbar.logout();
        }
      } catch {
        // Logout failed (e.g., page navigated away, DOM detached). Safe to ignore.
      }
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
