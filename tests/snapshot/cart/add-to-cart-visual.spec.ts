import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of the Products page after adding an
// item, and compares it pixel-for-pixel against a saved reference image
// to catch unexpected visual changes.
test('inventory page after adding Sauce Labs Backpack to cart matches baseline', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(page).toHaveScreenshot('inventory-after-add-to-cart.png', {
    fullPage: true,
  });
});
