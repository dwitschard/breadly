import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { NavbarPage } from '../../pages/shared/navbar.page';

test.describe('Sign in and out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('sign in via Cognito Hosted UI and sign out', async ({ page }) => {
    const username = process.env['E2E_DEMO_USERNAME'] ?? 'demo@breadly.app';
    const password = process.env['E2E_DEMO_PASSWORD'] ?? '';

    await page.goto('/recipes');

    await page.waitForURL('**/login**');

    const loginPage = new LoginPage(page);
    await loginPage.fillCognitoCredentials(username, password);
    await loginPage.expectLoggedIn();

    const navbar = new NavbarPage(page);
    await navbar.expectLoggedIn();

    await navbar.logout();

    await expect(page.getByTestId('home-title')).toBeVisible();
    await expect(page.getByTestId('home-login-btn')).toBeVisible();
  });
});
