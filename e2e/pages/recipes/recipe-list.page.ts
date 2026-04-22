import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class RecipeListPage {
  readonly heading: Locator;
  readonly recipeNameInput: Locator;
  readonly addRecipeButton: Locator;
  readonly recipeList: Locator;
  readonly emptyMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('recipes-title');
    this.recipeNameInput = page.getByTestId('recipe-name-input');
    this.addRecipeButton = page.getByTestId('recipe-add-btn');
    this.recipeList = page.getByTestId('recipe-list');
    this.emptyMessage = page.getByTestId('recipe-empty-message');
    this.loadingSpinner = page.locator('app-spinner');
  }

  async goto(): Promise<void> {
    await this.page.goto('recipes');
    await expect(this.heading).toBeVisible();
  }

  async createRecipe(name: string): Promise<void> {
    await this.recipeNameInput.fill(name);
    await this.addRecipeButton.click();
  }

  async deleteRecipe(name: string): Promise<void> {
    const item = this.getRecipeItem(name);
    const deleteBtn = item.locator('[data-testid^="recipe-delete-btn-"]');
    await deleteBtn.click();
  }

  getRecipeItem(name: string): Locator {
    return this.recipeList.locator('[data-testid="recipe-list-item"]', {
      hasText: name,
    });
  }

  async expectRecipeVisible(name: string): Promise<void> {
    await expect(this.getRecipeItem(name)).toBeVisible();
  }

  async expectRecipeNotVisible(name: string): Promise<void> {
    await this.expectListRendered();
    await expect(this.getRecipeItem(name)).not.toBeVisible();
  }

  async expectEmptyState(): Promise<void> {
    await expect(this.emptyMessage).toBeVisible();
  }

  async expectListRendered(): Promise<void> {
    await expect(this.recipeList.or(this.emptyMessage)).toBeVisible();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }
}
