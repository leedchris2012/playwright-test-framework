import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test('sorting by Price (high to low) reorders items', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Backpack');

  await inventoryPage.sortBy('hilo');

  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Fleece Jacket');
});
