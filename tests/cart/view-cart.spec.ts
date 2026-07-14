import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';

test.use({ storageState: '.auth/standard_user.json' });

// Checks that after adding an item, the cart page displays the right
// product name and price.
test('cart page shows the correct item and price after adding Sauce Labs Backpack', async ({
  page,
}) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  await expect(page).toHaveURL(/.*cart\.html/);

  const cartPage = new CartPage(page);
  await expect(cartPage.itemName).toHaveText('Sauce Labs Backpack');
  await expect(cartPage.itemPrice).toHaveText('$29.99');
});

// Checks that clicking "Remove" on a cart item actually takes it out of the cart.
test('removing an item from the cart page removes it', async ({ page }) => {
  await page.goto('/inventory.html');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
  await inventoryPage.cartIcon.click();

  const cartPage = new CartPage(page);
  await cartPage.getRemoveButton('Sauce Labs Backpack').click();

  await expect(cartPage.itemName).toHaveCount(0);
});
