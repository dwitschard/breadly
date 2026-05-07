import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class SettingsPage {
  readonly container: Locator;
  readonly languageSelect: Locator;
  readonly themeSelect: Locator;

  constructor(private readonly page: Page) {
    this.container = page.getByTestId('profile-settings');
    this.languageSelect = page.getByTestId('settings-language-select');
    this.themeSelect = page.getByTestId('settings-theme-select');
  }

  async expectLoaded(): Promise<void> {
    await expect(this.container).toBeVisible();
    await expect(this.languageSelect).toBeVisible();
    await expect(this.themeSelect).toBeVisible();
  }

  async selectLanguage(value: 'de' | 'en'): Promise<void> {
    await this.languageSelect.selectOption(value);
  }

  async selectTheme(value: 'light' | 'dark'): Promise<void> {
    await this.themeSelect.selectOption(value);
  }

  async expectLanguage(value: 'de' | 'en'): Promise<void> {
    await expect(this.languageSelect).toHaveValue(value);
  }

  async expectTheme(value: 'light' | 'dark'): Promise<void> {
    await expect(this.themeSelect).toHaveValue(value);
  }

  async expectDarkModeActive(): Promise<void> {
    await expect(this.page.locator('html')).toHaveClass(/dark/);
  }

  async expectDarkModeInactive(): Promise<void> {
    await expect(this.page.locator('html')).not.toHaveClass(/dark/);
  }
}
