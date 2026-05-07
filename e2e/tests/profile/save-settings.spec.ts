import { test, expect } from '../../fixtures/auth.fixture';
import { ProfilePage } from '../../pages/profile/profile.page';
import { SettingsPage } from '../../pages/profile/settings.page';

test.describe('Save user settings', () => {
  test.use({ role: 'user' });

  test('user changes theme and language on profile page and settings persist after reload', async ({ page }) => {
    const profile = new ProfilePage(page);
    const settings = new SettingsPage(page);

    await profile.goto();
    await profile.expectLoaded();
    await settings.expectLoaded();

    await settings.selectTheme('dark');
    await settings.expectDarkModeActive();

    await settings.selectLanguage('en');

    await page.reload();
    await page.waitForURL('**/profile**');
    await profile.expectLoaded();
    await settings.expectLoaded();

    await settings.expectTheme('dark');
    await settings.expectDarkModeActive();
    await settings.expectLanguage('en');

    await settings.selectTheme('light');
    await settings.expectDarkModeInactive();

    await settings.selectLanguage('de');
  });
});
