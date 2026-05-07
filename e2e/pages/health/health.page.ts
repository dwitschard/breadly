import type { Page, Locator } from '@playwright/test';
import { expect } from '@playwright/test';

export class HealthPage {
  readonly heading: Locator;
  readonly reloadButton: Locator;

  readonly apiCheck: Locator;
  readonly apiStatus: Locator;
  readonly apiResponseTime: Locator;

  readonly mongodbCheck: Locator;
  readonly mongodbStatus: Locator;

  readonly dynamodbCheck: Locator;
  readonly dynamodbStatus: Locator;

  readonly overallStatus: Locator;

  readonly frontendVersion: Locator;
  readonly frontendVersionValue: Locator;
  readonly backendVersion: Locator;
  readonly backendVersionValue: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByTestId('health-title');
    this.reloadButton = page.getByTestId('health-reload-btn');

    this.apiCheck = page.getByTestId('health-check-api');
    this.apiStatus = page.getByTestId('health-check-api-status');
    this.apiResponseTime = page.getByTestId('health-check-api-time');

    this.mongodbCheck = page.getByTestId('health-check-mongodb');
    this.mongodbStatus = page.getByTestId('health-check-mongodb-status');

    this.dynamodbCheck = page.getByTestId('health-check-dynamodb');
    this.dynamodbStatus = page.getByTestId('health-check-dynamodb-status');

    this.overallStatus = page.getByTestId('health-overall-status');

    this.frontendVersion = page.getByTestId('health-version-frontend');
    this.frontendVersionValue = page.getByTestId('health-version-frontend-value');
    this.backendVersion = page.getByTestId('health-version-backend');
    this.backendVersionValue = page.getByTestId('health-version-backend-value');
  }

  async goto(): Promise<void> {
    await this.page.goto('health');
    await expect(this.heading).toBeVisible();
  }

  async expectLoaded(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.apiCheck).toBeVisible();
    await expect(this.mongodbCheck).toBeVisible();
    await expect(this.dynamodbCheck).toBeVisible();
  }

  async expectAllOperational(): Promise<void> {
    await expect(this.apiStatus).toHaveAttribute('data-status', 'ok');
    await expect(this.mongodbStatus).toHaveAttribute('data-status', 'ok');
    await expect(this.dynamodbStatus).toHaveAttribute('data-status', 'ok');
  }

  async expectResponseTimesVisible(): Promise<void> {
    await expect(this.apiResponseTime).toBeAttached();
  }

  async expectVersionsVisible(): Promise<void> {
    await expect(this.frontendVersionValue).toBeVisible();
    await expect(this.backendVersionValue).toBeVisible();
    await expect(this.frontendVersionValue).not.toBeEmpty();
    await expect(this.backendVersionValue).not.toBeEmpty();
  }

  async expectOverallStatusVisible(): Promise<void> {
    await expect(this.overallStatus).toBeVisible();
  }

  async reload(): Promise<void> {
    await this.reloadButton.click();
  }
}
