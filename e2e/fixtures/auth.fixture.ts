import { test as base } from '@playwright/test';
import fs from 'node:fs';

export const test = base.extend<{ authenticatedPage: void }>({
  authenticatedPage: [
    async ({}, use) => {
      const storageStatePath = '.auth/user.json';
      if (!fs.existsSync(storageStatePath)) {
        throw new Error(
          'No storageState found at .auth/user.json — did globalSetup run? ' +
            'Set E2E_COGNITO_CLIENT_ID and E2E_DEMO_PASSWORD env vars.',
        );
      }
      await use();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
