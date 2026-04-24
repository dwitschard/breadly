import { test, expect } from '../../fixtures/auth.fixture';
import { ProfilePage } from '../../pages/profile/profile.page';

test.describe('View profile', () => {
  test.use({ role: 'user' });

  test('displays the logged-in user profile information', async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await profile.expectLoaded();

    await profile.expectUserId();
    // await profile.expectDisplayName('Demo User');
    await profile.expectEmail('demo@breadly.app');
  });
});
