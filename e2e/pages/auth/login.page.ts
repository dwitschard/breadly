import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.loginButton = page.getByTestId('home-login-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('.');
  }

  async expectRedirectedToLogin(): Promise<void> {
    await this.page.waitForURL('**/login**');
  }

  async waitForCognitoForm({ timeout = 15_000 }: { timeout?: number } = {}): Promise<void> {
    await this.page.locator('input[name="username"]:visible').waitFor({ state: 'visible', timeout });
  }

  async fillCognitoCredentials(
    username: string,
    password: string,
    { timeout = 15_000 }: { timeout?: number } = {},
  ): Promise<void> {
    const usernameInput = this.page.locator('input[name="username"]:visible');
    const passwordInput = this.page.locator('input[name="password"]:visible');
    const submitButton = this.page.locator('form#primary-form button[type="submit"]:visible');

    await usernameInput.waitFor({ state: 'visible', timeout });
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await submitButton.click();
  }

  async expectLoggedIn(): Promise<void> {
    await this.page.waitForURL('**/recipes**', { timeout: 30_000 });
  }
}
