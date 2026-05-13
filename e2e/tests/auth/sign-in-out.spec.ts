import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/auth/login.page';
import { NavbarPage } from '../../pages/shared/navbar.page';

test.describe('Sign in and out', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  // This test navigates through the Cognito Hosted UI, which requires a
  // deployed environment with registered redirect URIs. Skip when running
  // against localhost (E2E_BASE_URL not set).
  test.skip(
    !process.env['E2E_BASE_URL'],
    'Cognito Hosted UI login requires a deployed environment',
  );

  test('sign in via Cognito Hosted UI and sign out', async ({ page }) => {
    const username = process.env['E2E_DEMO_USERNAME'] ?? 'demo@breadly.app';
    const password = process.env['E2E_DEMO_PASSWORD'] ?? '';

    const loginPage = new LoginPage(page);

    await page.goto('recipes');

    // Wait for the Cognito Hosted UI form to appear (ensures redirect completed)
    await loginPage.waitForCognitoForm();

    // Verify the Cognito Hosted UI is on the correct auth domain
    const currentUrl = page.url();
    const baseUrl = process.env['E2E_BASE_URL'] ?? '';
    let expectedAuthDomain: string;
    if (baseUrl.includes('preview')) {
      expectedAuthDomain = 'preview.auth.appdock.ch';
    } else if (baseUrl.includes('dev.')) {
      expectedAuthDomain = 'dev.auth.appdock.ch';
    } else {
      expectedAuthDomain = 'auth.appdock.ch';
    }
    expect(currentUrl).toContain(expectedAuthDomain);

    await loginPage.fillCognitoCredentials(username, password);
    await loginPage.expectLoggedIn();

    const navbar = new NavbarPage(page);
    await navbar.expectLoggedIn();

    await navbar.logout();

    await expect(page.getByTestId('home-title')).toBeVisible();
    await expect(page.getByTestId('home-login-btn')).toBeVisible();
  });
});
