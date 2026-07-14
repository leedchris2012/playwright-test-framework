import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { InventoryPage } from '../../../pages/InventoryPage';

// Visual check: takes a screenshot of the cart page with an item in it,
// and compares it pixel-for-pixel against a saved reference image to
// catch unexpected visual changes.
test('cart page with Sauce Labs Backpack matches baseline', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveScreenshot('cart-page-with-backpack.png', {
    fullPage: true,
  });
});
