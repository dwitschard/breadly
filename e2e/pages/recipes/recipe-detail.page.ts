import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class RecipeDetailPage {
  readonly heading: Locator;
  readonly recipeName: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('recipe-detail-title');
    this.recipeName = page.getByTestId('recipe-detail-name');
  }

  async expectRecipeName(name: string): Promise<void> {
    await expect(this.recipeName).toContainText(name);
  }
}
