import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {
  readonly page: Page;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.itemName = page.locator('[data-test="inventory-item-name"]');
    this.itemPrice = page.locator('[data-test="inventory-item-price"]');
    this.backButton = page.locator('[data-test="back-to-products"]');
  }
}
