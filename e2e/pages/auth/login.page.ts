import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class LoginPage {
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.loginButton = page.getByTestId('home-login-btn');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async expectRedirectedToLogin(): Promise<void> {
    await this.page.waitForURL('**/login**');
  }

  async fillCognitoCredentials(
    username: string,
    password: string,
  ): Promise<void> {
    await this.page.locator('input[name="username"]').fill(username);
    await this.page.locator('input[name="password"]').fill(password);
    await this.page.locator('input[type="submit"][name="signInSubmitButton"]').click();
  }

  async expectLoggedIn(): Promise<void> {
    await this.page.waitForURL('**/recipes**', { timeout: 30_000 });
  }
}
