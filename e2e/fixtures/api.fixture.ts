import { test as authTest } from './auth.fixture';
import type { APIRequestContext } from '@playwright/test';
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

export const test = authTest.extend<ApiFixture>({
  api: async ({ request }, use) => {
    await use({
      createRecipe: (data: RecipeData) => createRecipeViaApi(request, data),
      deleteRecipe: (id: string) => deleteRecipeViaApi(request, id),
      cleanupTestRecipes: (testName: string) =>
        cleanupTestRecipes(request, testName),
      uniqueName,
    });
  },
});

export { expect } from '@playwright/test';
