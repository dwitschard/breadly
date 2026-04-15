import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class RecipeFormPage {
  readonly nameInput: Locator;
  readonly submitButton: Locator;

  constructor(private readonly page: Page) {
    this.nameInput = page.getByTestId('recipe-name-input');
    this.submitButton = page.getByTestId('recipe-add-btn');
  }

  async fillName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async createRecipe(name: string): Promise<void> {
    await this.fillName(name);
    await this.submit();
  }

  async expectSubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  async expectSubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }
}
