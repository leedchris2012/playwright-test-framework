import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

// Checks that adding one item to the cart makes the cart icon show "1".
test('adds Sauce Labs Backpack to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(inventoryPage.cartBadge).toHaveText('1');
});

// Checks that adding two different items shows a cart count of "2", and
// that the cart page lists both items with their correct prices.
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

// Checks that adding an item swaps its inventory-page button from "Add to
// cart" to "Remove".
test('shows a Remove button on the inventory page after adding an item to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();

  await expect(inventoryPage.getRemoveButton('Sauce Labs Backpack')).toHaveText('Remove');
});

// Checks that clicking Remove on the inventory page takes the item out of
// the cart and swaps the button back to "Add to cart".
test('clicking Remove on the inventory page removes the item from the cart and reverts the button', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await expect(inventoryPage.cartBadge).toHaveText('1');

  await inventoryPage.getRemoveButton('Sauce Labs Backpack').click();

  await expect(inventoryPage.cartBadge).toHaveCount(0);
  await expect(inventoryPage.getAddToCartButton('Sauce Labs Backpack')).toHaveText('Add to cart');
});

// Bug check: for the "error_user" test account, clicking "Add to cart" on
// certain items (Sauce Labs Bolt T-Shirt, Sauce Labs Fleece Jacket,
// Test.allTheThings() T-Shirt (Red)) silently fails — the button stays
// "Add to cart" and the item never reaches the cart. Verified live: 3 of
// 6 items add successfully, 3 don't, so the cart badge caps at "3" even
// after clicking every item's button. This test confirms that known bug.
test('error_user: cannot add all items to the cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('error_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  const itemNames = await inventoryPage.getItemNames();

  for (const name of itemNames) {
    await inventoryPage.getAddToCartButton(name).click();
  }

  await expect(inventoryPage.cartBadge).toHaveText('3');

  await expect(inventoryPage.getRemoveButton('Sauce Labs Backpack')).toHaveText('Remove');
  await expect(inventoryPage.getRemoveButton('Sauce Labs Bike Light')).toHaveText('Remove');
  await expect(inventoryPage.getAddToCartButton('Sauce Labs Bolt T-Shirt')).toHaveText('Add to cart');
  await expect(inventoryPage.getAddToCartButton('Sauce Labs Fleece Jacket')).toHaveText('Add to cart');
  await expect(inventoryPage.getRemoveButton('Sauce Labs Onesie')).toHaveText('Remove');
  await expect(inventoryPage.getAddToCartButton('Test.allTheThings() T-Shirt (Red)')).toHaveText('Add to cart');
});
