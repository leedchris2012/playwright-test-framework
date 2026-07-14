import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test('cart page shows the correct item and price after adding Sauce Labs Backpack', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveURL(/.*cart\.html/);

  const cartPage = new CartPage(page);
  await expect(cartPage.itemName).toHaveText('Sauce Labs Backpack');
  await expect(cartPage.itemPrice).toHaveText('$29.99');
});

test('removing an item from the cart page removes it', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.getRemoveButton('Sauce Labs Backpack').click();

  await expect(cartPage.itemName).toHaveCount(0);
});
