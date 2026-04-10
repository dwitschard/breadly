import { test, expect } from '../../fixtures/auth.fixture';
import { ProfilePage } from '../../pages/profile/profile.page';

test.describe('View profile', () => {
  test('displays the demo user profile information', async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.expectLoaded();

    await profile.expectEmail('demo@breadly.app');
    await profile.expectUserId();
    await profile.expectRoleVisible('USER');
  });
});
