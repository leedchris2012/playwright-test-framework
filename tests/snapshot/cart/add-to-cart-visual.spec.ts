import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { InventoryPage } from '../../../pages/InventoryPage';

// Visual check: takes a screenshot of the Products page after adding an
// item, and compares it pixel-for-pixel against a saved reference image
// to catch unexpected visual changes.
test('inventory page after adding Sauce Labs Backpack to cart matches baseline', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(page).toHaveScreenshot('inventory-after-add-to-cart.png', {
    fullPage: true,
  });
});
