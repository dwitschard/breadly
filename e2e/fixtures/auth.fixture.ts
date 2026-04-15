import { test as base } from '@playwright/test';
import fs from 'node:fs';
import { NavbarPage } from '../pages/shared/navbar.page';

type Role = 'user' | 'admin';

const STORAGE_PATHS: Record<Role, string> = {
  user: '.auth/user.json',
  admin: '.auth/admin.json',
};

export const test = base.extend<{ role: Role; authSession: void }>({
  role: ['user', { option: true }],

  authSession: [
    async ({ page, role }, use) => {
      const storagePath = STORAGE_PATHS[role];

      if (!fs.existsSync(storagePath)) {
        throw new Error(
          `No storageState found at ${storagePath} — did globalSetup run? ` +
            `Set credentials for the "${role}" user in .env.`,
        );
      }

      const storageState = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
      const origin = storageState.origins?.[0];

      if (!origin?.localStorage?.length) {
        throw new Error(
          `Storage state at ${storagePath} contains no localStorage entries — ` +
            `the "${role}" user may not have authenticated correctly in globalSetup.`,
        );
      }

      await page.context().addInitScript((entries: { name: string; value: string }[]) => {
        for (const entry of entries) {
          localStorage.setItem(entry.name, entry.value);
        }
      }, origin.localStorage);

      await page.goto('.');
      const navbar = new NavbarPage(page);
      await navbar.expectLoggedIn();

      await use();

      // After each test: log out if the user is still signed in.
      // Wrapped in try/catch so teardown errors never mask real test failures.
      try {
        const isLoggedIn = await navbar.profileMenuTrigger
          .isVisible()
          .catch(() => false);
        if (isLoggedIn) {
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
