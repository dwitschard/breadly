import type { APIRequestContext } from '@playwright/test';

export interface RecipeData {
  name: string;
}

export interface CreatedRecipe {
  _id: string;
  name: string;
}

let counter = 0;

export function uniqueName(testName: string, label: string): string {
  const timestamp = Date.now();
  counter++;
  return `[E2E-${testName}] ${label}-${timestamp}-${counter}`;
}

export async function createRecipeViaApi(
  request: APIRequestContext,
  data: RecipeData,
): Promise<CreatedRecipe> {
  const response = await request.post('/api/recipes', {
    data: { name: data.name },
  });

  if (!response.ok()) {
    throw new Error(
      `Failed to create recipe "${data.name}": ${response.status()} ${await response.text()}`,
    );
  }

  return (await response.json()) as CreatedRecipe;
}

export async function deleteRecipeViaApi(
  request: APIRequestContext,
  id: string,
): Promise<void> {
  const response = await request.delete(`/api/recipes/${id}`);

  if (!response.ok() && response.status() !== 404) {
    throw new Error(
      `Failed to delete recipe "${id}": ${response.status()} ${await response.text()}`,
    );
  }
}

export async function getAllRecipesViaApi(
  request: APIRequestContext,
): Promise<CreatedRecipe[]> {
  const response = await request.get('/api/recipes');

  if (!response.ok()) {
    throw new Error(
      `Failed to list recipes: ${response.status()} ${await response.text()}`,
    );
  }

  return (await response.json()) as CreatedRecipe[];
}

export async function cleanupTestRecipes(
  request: APIRequestContext,
  testName: string,
): Promise<void> {
  const prefix = `[E2E-${testName}]`;
  const recipes = await getAllRecipesViaApi(request);
  const testRecipes = recipes.filter((r) => r.name.startsWith(prefix));

  for (const recipe of testRecipes) {
    await deleteRecipeViaApi(request, recipe._id);
  }
}
