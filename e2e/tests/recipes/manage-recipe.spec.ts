import { test, expect } from '../../fixtures/auth.fixture';
import { RecipeListPage } from '../../pages/recipes/recipe-list.page';
import { uniqueName } from '../../helpers/test-data.helper';

const TEST_NAME = 'manage-recipe';

test.describe('Manage recipes', () => {
  test('create a recipe via UI, verify it appears, then delete it', async ({
    page,
  }) => {
    const recipeName = uniqueName(TEST_NAME, 'Banana Bread');
    const recipeList = new RecipeListPage(page);

    await recipeList.goto();
    await recipeList.expectLoaded();

    await recipeList.createRecipe(recipeName);
    await recipeList.expectRecipeVisible(recipeName);

    await recipeList.deleteRecipe(recipeName);
    await recipeList.expectRecipeNotVisible(recipeName);
  });
});
