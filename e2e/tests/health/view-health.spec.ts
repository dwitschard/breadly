import { test, ADMIN_STORAGE_STATE } from '../../fixtures/auth.fixture';
import { NavbarPage } from '../../pages/shared/navbar.page';
import { HealthPage } from '../../pages/health/health.page';

test.describe('View health dashboard', () => {
  test.use({ storageState: ADMIN_STORAGE_STATE });

  test('admin navigates to health page and sees all system data', async ({ page }) => {
    const navbar = new NavbarPage(page);
    const health = new HealthPage(page);

    await page.goto('.');
    await navbar.expectLoggedIn();

    await navbar.navigateToHealth();
    await health.expectLoaded();

    await health.expectAllOperational();
    await health.expectResponseTimesVisible();
    await health.expectOverallStatusVisible();

    await health.expectVersionsVisible();
  });

  test('admin can reload health data', async ({ page }) => {
    const health = new HealthPage(page);

    await health.goto();
    await health.expectLoaded();

    await health.reload();

    await health.expectLoaded();
    await health.expectAllOperational();
  });
});
