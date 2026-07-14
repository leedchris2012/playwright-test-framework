import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../pages/InventoryPage';

test.use({ storageState: '.auth/standard_user.json' });

// Visual check: takes a screenshot of a product's details page, and
// compares it pixel-for-pixel against a saved reference image to catch
// unexpected visual changes.
test('Sauce Labs Backpack details page matches baseline', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

  await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);
  await expect(page).toHaveScreenshot('product-details-backpack.png', {
    fullPage: true,
  });
});
