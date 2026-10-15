import { Page, Locator } from '@playwright/test';

export class ProductDetailsPage {
  readonly page: Page;
  readonly itemName: Locator;
  readonly itemPrice: Locator;
  readonly backButton: Locator;
  readonly addToCartButton: Locator;
  readonly removeButton: Locator;
  readonly cartBadge: Locator;
  readonly cartIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    // Classes, not data-test: the product list reuses these data-test values, so a data-test
    // locator can match the list during the SPA transition (flaky strict-mode failure in CI).
    this.itemName = page.locator('.inventory_details_name');
    this.itemPrice = page.locator('.inventory_details_price');
    this.backButton = page.locator('[data-test="back-to-products"]');
    // Scoped to the details container for the same reason: the list's buttons share these names.
    const details = page.locator('.inventory_details_desc_container');
    this.addToCartButton = details.getByRole('button', { name: 'Add to cart' });
    this.removeButton = details.getByRole('button', { name: 'Remove' });
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.cartIcon = page.locator('.shopping_cart_link');
  }

  async goto(productId: number): Promise<void> {
    await this.page.goto(`/inventory-item.html?id=${productId}`);
  }
}
