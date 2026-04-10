import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class NavbarPage {
  readonly recipesLink: Locator;
  readonly healthLink: Locator;
  readonly profileButton: Locator;
  readonly loginButton: Locator;
  readonly logoutButton: Locator;
  readonly homeLink: Locator;
  readonly profileMenuTrigger: Locator;
  readonly profileMenuDropdown: Locator;
  readonly displayName: Locator;
  readonly displayEmail: Locator;

  constructor(private readonly page: Page) {
    this.homeLink = page.getByTestId('nav-home-link');
    this.recipesLink = page.getByTestId('nav-recipes-link');
    this.healthLink = page.getByTestId('nav-health-link');
    this.profileMenuTrigger = page.getByTestId('nav-profile-trigger');
    this.profileMenuDropdown = page.getByRole('menu');
    this.profileButton = page.getByTestId('nav-profile-btn');
    this.logoutButton = page.getByTestId('nav-logout-btn');
    this.loginButton = page.getByTestId('nav-login-btn');
    this.displayName = page.getByTestId('nav-display-name');
    this.displayEmail = page.getByTestId('nav-display-email');
  }

  async navigateToRecipes(): Promise<void> {
    await this.recipesLink.click();
    await this.page.waitForURL('**/recipes**');
  }

  async navigateToHealth(): Promise<void> {
    await this.healthLink.click();
    await this.page.waitForURL('**/health**');
  }

  async navigateToProfile(): Promise<void> {
    await this.openProfileMenu();
    await this.profileButton.click();
    await this.page.waitForURL('**/profile**');
  }

  async navigateToHome(): Promise<void> {
    await this.homeLink.click();
    await expect(this.page.getByTestId('home-title')).toBeVisible();
  }

  async openProfileMenu(): Promise<void> {
    await this.profileMenuTrigger.click();
    await this.profileMenuDropdown.waitFor({ state: 'visible' });
  }

  async logout(): Promise<void> {
    await this.openProfileMenu();
    await this.logoutButton.click();
  }

  async expectLoggedIn(): Promise<void> {
    await expect(this.profileMenuTrigger).toBeVisible();
  }

  async expectLoggedOut(): Promise<void> {
    await expect(this.loginButton).toBeVisible();
  }

  async expectRecipesLinkVisible(): Promise<void> {
    await expect(this.recipesLink).toBeVisible();
  }

  async expectHealthLinkVisible(): Promise<void> {
    await expect(this.healthLink).toBeVisible();
  }
}
