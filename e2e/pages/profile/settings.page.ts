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
    const saved = this.page.waitForResponse(
      r => r.url().includes('/profile/settings') && r.request().method() === 'PATCH',
    );
    await this.languageSelect.getByTestId('dropdown-trigger').click();
    await this.languageSelect.locator(`[data-value="${value}"]`).click();
    await saved;
  }

  async selectTheme(value: 'light' | 'dark'): Promise<void> {
    const saved = this.page.waitForResponse(
      r => r.url().includes('/profile/settings') && r.request().method() === 'PATCH',
    );
    await this.themeSelect.getByTestId('dropdown-trigger').click();
    await this.themeSelect.locator(`[data-value="${value}"]`).click();
    await saved;
  }

  async expectLanguage(value: 'de' | 'en'): Promise<void> {
    await expect(this.languageSelect.getByTestId('dropdown-trigger')).toHaveAttribute('data-selected', value);
  }

  async expectTheme(value: 'light' | 'dark'): Promise<void> {
    await expect(this.themeSelect.getByTestId('dropdown-trigger')).toHaveAttribute('data-selected', value);
  }

  async expectDarkModeActive(): Promise<void> {
    await expect(this.page.locator('html')).toHaveClass(/dark/);
  }

  async expectDarkModeInactive(): Promise<void> {
    await expect(this.page.locator('html')).not.toHaveClass(/dark/);
  }
}
