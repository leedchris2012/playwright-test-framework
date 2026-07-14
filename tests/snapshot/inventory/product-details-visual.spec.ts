import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { InventoryPage } from '../../../pages/InventoryPage';

// Visual check: takes a screenshot of a product's details page, and
// compares it pixel-for-pixel against a saved reference image to catch
// unexpected visual changes.
test('Sauce Labs Backpack details page matches baseline', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

  await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);
  await expect(page).toHaveScreenshot('product-details-backpack.png', {
    fullPage: true,
  });
});
