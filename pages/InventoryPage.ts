import { Page, Locator } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;
  readonly cartBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator('.shopping_cart_badge');
  }

  getAddToCartButton(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('button');
  }
}
