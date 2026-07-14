import { Page, Locator } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly page: Page;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly sortDropdown: Locator;
  readonly firstItemName: Locator;
  readonly itemImages: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.firstItemName = page.locator('.inventory_item_name').first();
    this.itemImages = page.locator('.inventory_item_img img');
  }

  async getItemImageSources(): Promise<string[]> {
    return this.itemImages.evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
  }

  getAddToCartButton(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('button');
  }

  getItemPrice(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('.inventory_item_price');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }
}
