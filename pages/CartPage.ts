import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly itemName: Locator;
  readonly itemPrice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.itemName = page.locator('.cart_item .inventory_item_name');
    this.itemPrice = page.locator('.cart_item .inventory_item_price');
  }

  getRemoveButton(productName: string): Locator {
    return this.page
      .locator('.cart_item', { hasText: productName })
      .locator('button');
  }
}
