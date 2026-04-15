import { test as base } from '@playwright/test';
import fs from 'node:fs';

export const ADMIN_STORAGE_STATE = '.auth/admin.json' as const;

export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: [
    async ({}, use) => {
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
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
