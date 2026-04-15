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

  async fillCognitoCredentials(
    username: string,
    password: string,
  ): Promise<void> {
    const usernameInput = this.page.locator('input[id="signInFormUsername"]:visible');
    const passwordInput = this.page.locator('input[id="signInFormPassword"]:visible');
    const submitButton = this.page.locator('input[type="submit"][name="signInSubmitButton"]:visible');

    await usernameInput.waitFor({ state: 'visible', timeout: 15_000 });
    await usernameInput.fill(username);
    await passwordInput.fill(password);
    await submitButton.click();
  }

  async expectLoggedIn(): Promise<void> {
    await this.page.waitForURL('**/recipes**', { timeout: 30_000 });
  }
}
