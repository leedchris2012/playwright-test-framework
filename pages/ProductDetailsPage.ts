import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {
  readonly page: Page;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Classes, not data-test: the product list reuses these data-test values, so a data-test
    // locator can match the list during the SPA transition (flaky strict-mode failure in CI).
    this.itemName = page.locator('.inventory_details_name');
    this.itemPrice = page.locator('.inventory_details_price');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }
}
