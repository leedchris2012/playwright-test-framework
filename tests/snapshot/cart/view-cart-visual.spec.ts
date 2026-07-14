import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of the cart page with an item in it,
// and compares it pixel-for-pixel against a saved reference image to
// catch unexpected visual changes.
test('cart page with Sauce Labs Backpack matches baseline', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveScreenshot('cart-page-with-backpack.png', {
    fullPage: true,
  });
});
