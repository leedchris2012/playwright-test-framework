import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test('inventory page after adding Sauce Labs Backpack to cart matches baseline', async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName !== 'chromium',
    'Visual snapshots run on chromium only to avoid cross-engine rendering noise'
  );

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(page).toHaveScreenshot('inventory-after-add-to-cart.png', {
    fullPage: true,
  });
});
