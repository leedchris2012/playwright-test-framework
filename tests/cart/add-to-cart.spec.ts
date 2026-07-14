import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test('adds Sauce Labs Backpack to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(inventoryPage.cartBadge).toHaveText('1');
});
