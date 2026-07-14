import { Page, Locator } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

export class InventoryPage {
  readonly page: Page;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;
  readonly sortDropdown: Locator;
  readonly firstItemName: Locator;
  readonly lastItemName: Locator;
  readonly itemNames: Locator;
  readonly itemImages: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.firstItemName = page.locator('.inventory_item_name').first();
    this.lastItemName = page.locator('.inventory_item_name').last();
    this.itemNames = page.locator('.inventory_item_name');
    this.itemImages = page.locator('.inventory_item_img img');
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.logoutLink = page.locator('#logout_sidebar_link');
  }

  async getItemImageSources(): Promise<string[]> {
    return this.itemImages.evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src));
  }

  async getItemNames(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
  }

  getAddToCartButton(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('button');
  }

  getRemoveButton(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('button');
  }

  getItemPrice(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('.inventory_item_price');
  }

  getItemImage(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('.inventory_item_img img');
  }

  getItemNameLink(productName: string): Locator {
    return this.page
      .locator('.inventory_item', { hasText: productName })
      .locator('.inventory_item_name');
  }

  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }
}
