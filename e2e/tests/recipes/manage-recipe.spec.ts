import { test, expect } from '../../fixtures/api.fixture';
import { RecipeListPage } from '../../pages/recipes/recipe-list.page';

const TEST_NAME = 'manage-recipe';

test.describe('Manage recipes', () => {
  let recipeName: string;

  test.beforeEach(async ({ api }) => {
    recipeName = api.uniqueName(TEST_NAME, 'Banana Bread');
  });

  test.afterEach(async ({ api }) => {
    await api.cleanupTestRecipes(TEST_NAME);
  });

  test('create a recipe, verify it appears, then delete it', async ({
    page,
  }) => {
    const recipeList = new RecipeListPage(page);
    await recipeList.goto();
    await recipeList.expectLoaded();

    await recipeList.createRecipe(recipeName);

    await recipeList.expectRecipeVisible(recipeName);

    await recipeList.deleteRecipe(recipeName);

    await recipeList.expectRecipeNotVisible(recipeName);
  });

  test('create a recipe via API and verify it appears in the list', async ({
    page,
    api,
  }) => {
    await api.createRecipe({ name: recipeName });

    const recipeList = new RecipeListPage(page);
    await recipeList.goto();
    await recipeList.expectLoaded();

    await recipeList.expectRecipeVisible(recipeName);
  });
});
