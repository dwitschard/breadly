import { test, expect } from '../../fixtures/auth.fixture';
import { NavbarPage } from '../../pages/shared/navbar.page';

test.describe('Browse pages', () => {
  test.use({ role: 'user' });

  test('user navigates home → recipes → profile → home via navbar', async ({
    page,
  }) => {
    const navbar = new NavbarPage(page);

    await navbar.expectRecipesLinkVisible();

    await navbar.navigateToRecipes();
    await expect(page.getByTestId('recipes-title')).toBeVisible();
    await expect(page.getByTestId('recipe-name-input')).toBeVisible();

    await navbar.navigateToProfile();
    await expect(page.getByTestId('profile-title')).toBeVisible();
    await navbar.expectDisplayName('Demo User');

    await navbar.navigateToHome();
    await expect(page.getByTestId('home-login-btn')).not.toBeVisible();
  });
});
