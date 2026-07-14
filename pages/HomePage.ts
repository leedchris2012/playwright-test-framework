import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly logo: Locator;

  constructor(page: Page) {
    this.page = page;
    this.logo = page.locator('.login_logo');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }
}
