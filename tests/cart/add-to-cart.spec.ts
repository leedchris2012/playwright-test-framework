import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test('adds Sauce Labs Backpack to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(inventoryPage.cartBadge).toHaveText('1');
});

test('adds multiple items to cart and shows both with correct prices', async ({
  page,
}) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.getAddToCartButton('Sauce Labs Bolt T-Shirt').click();

  await expect(inventoryPage.cartBadge).toHaveText('2');

  await inventoryPage.cartIcon.click();
  await expect(page).toHaveURL(/.*cart\.html/);

  const cartPage = new CartPage(page);
  await expect(cartPage.itemName).toHaveCount(2);
  await expect(cartPage.getItemPrice('Sauce Labs Backpack')).toHaveText('$29.99');
  await expect(cartPage.getItemPrice('Sauce Labs Bolt T-Shirt')).toHaveText('$15.99');
});
