import { test, expect } from '../../fixtures/auth.fixture';
import { NavbarPage } from '../../pages/shared/navbar.page';

test.describe('Browse pages', () => {
  test('navigate between recipes and profile via navbar', async ({
    page,
  }) => {
    const navbar = new NavbarPage(page);

    await page.goto('.');

    await navbar.expectLoggedIn();
    await navbar.expectRecipesLinkVisible();

    await navbar.navigateToRecipes();
    await expect(page.getByTestId('recipes-title')).toBeVisible();

    await navbar.navigateToProfile();
    await expect(page.getByTestId('profile-title')).toBeVisible();

    await navbar.navigateToHome();
    await expect(page.getByTestId('home-title')).toBeVisible();
  });
});
