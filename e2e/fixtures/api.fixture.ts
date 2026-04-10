import { test as authTest } from './auth.fixture';
import { request as playwrightRequest } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';
import fs from 'node:fs';
import {
  createRecipeViaApi,
  deleteRecipeViaApi,
  cleanupTestRecipes,
  uniqueName,
  type RecipeData,
  type CreatedRecipe,
} from '../helpers/test-data.helper';

interface ApiFixture {
  api: {
    createRecipe: (data: RecipeData) => Promise<CreatedRecipe>;
    deleteRecipe: (id: string) => Promise<void>;
    cleanupTestRecipes: (testName: string) => Promise<void>;
    uniqueName: (testName: string, label: string) => string;
  };
}

function readAccessToken(storageStatePath: string): string {
  const raw = fs.readFileSync(storageStatePath, 'utf-8');
  const state = JSON.parse(raw) as {
    origins?: { localStorage?: { name: string; value: string }[] }[];
  };

  const entry = state.origins
    ?.flatMap((o) => o.localStorage ?? [])
    .find((e) => e.name === 'access_token');

  if (!entry) {
    throw new Error(
      `No access_token found in storageState at ${storageStatePath}`,
    );
  }

  return entry.value;
}

export const test = authTest.extend<ApiFixture>({
  api: async ({ baseURL }, use) => {
    const token = readAccessToken('.auth/user.json');

    const apiContext = await playwrightRequest.newContext({
      baseURL: baseURL ?? undefined,
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    await use({
      createRecipe: (data: RecipeData) => createRecipeViaApi(apiContext, data),
      deleteRecipe: (id: string) => deleteRecipeViaApi(apiContext, id),
      cleanupTestRecipes: (testName: string) =>
        cleanupTestRecipes(apiContext, testName),
      uniqueName,
    });

    await apiContext.dispose();
  },
});

export { expect } from '@playwright/test';
