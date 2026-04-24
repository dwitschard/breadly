import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class ProfilePage {
  readonly heading: Locator;
  readonly email: Locator;
  readonly userId: Locator;
  readonly displayName: Locator;
  readonly roles: Locator;
  readonly emailVerifiedBadge: Locator;
  readonly loadingMessage: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('profile-title');
    this.email = page.getByTestId('profile-email');
    this.userId = page.getByTestId('profile-user-id');
    this.displayName = page.getByTestId('profile-display-name');
    this.roles = page.getByTestId('profile-role');
    this.emailVerifiedBadge = page.getByTestId('profile-email-verified');
    this.loadingMessage = page.getByText('Profil wird geladen');
  }

  async goto(): Promise<void> {
    await this.page.goto('profile');
    await expect(this.heading).toBeVisible();
  }

  async expectEmail(email: string): Promise<void> {
    await expect(this.email).toContainText(email);
  }

  async expectUserId(): Promise<void> {
    await expect(this.userId).not.toBeEmpty();
  }

  async expectRoleVisible(role: string): Promise<void> {
    await expect(this.page.getByTestId('profile-role').filter({ hasText: role })).toBeVisible();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
  }

  async expectDisplayName(name: string): Promise<void> {
    await expect(this.displayName).toContainText(name);
  }
}
