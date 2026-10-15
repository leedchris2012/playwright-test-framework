import { test, expect } from '@playwright/test';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';
import { CartPage } from '../../pages/CartPage';

// The Fleece Jacket's details page. Opened by URL, not by clicking the product name:
// problem_user's product links are shifted by one (BUG-004), so clicking "Sauce Labs Fleece
// Jacket" lands on id=6 ("ITEM NOT FOUND") and this test would check the wrong page.
const FLEECE_JACKET_ID = 5;

// Same product, two accounts: standard_user is the baseline, so a failure for problem_user
// alone shows the bug is account-specific, not a broken product.
for (const account of ['standard_user', 'problem_user'] as const) {
  test.describe(account, () => {
    test.use({ storageState: `.auth/${account}.json` });

    // Checks that "Add to cart" on a product's details page adds that product: the button
    // swaps to "Remove", the cart badge shows "1", and the cart page lists the product.
    test('adds Sauce Labs Fleece Jacket to cart from its details page', async ({ page }) => {
      // Bug check (found by the persona-explorer agent, first-time × problem_user session):
      // for problem_user, "Add to cart" on this details page does nothing. Marked
      // test.fail() so the known bug doesn't turn the suite red; it flags if it's ever fixed.
      test.fail(account === 'problem_user', 'problem_user: Add to cart on the Fleece Jacket details page does nothing');

      const detailsPage = new ProductDetailsPage(page);
      await detailsPage.goto(FLEECE_JACKET_ID);
      await expect(detailsPage.itemName).toHaveText('Sauce Labs Fleece Jacket');

      await detailsPage.addToCartButton.click();

      await expect(detailsPage.removeButton).toBeVisible();
      await expect(detailsPage.cartBadge).toHaveText('1');

      await detailsPage.cartIcon.click();
      await expect(page).toHaveURL(/.*cart\.html/);

      const cartPage = new CartPage(page);
      await expect(cartPage.itemName).toHaveText(['Sauce Labs Fleece Jacket']);
    });
  });
}
