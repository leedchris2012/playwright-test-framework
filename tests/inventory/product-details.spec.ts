import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that clicking a product's image takes you to that product's own
  // details page, showing the matching name and price.
  test('clicking a product image opens its details page with matching name and price', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const expectedPrice = await inventoryPage.getItemPrice('Sauce Labs Backpack').textContent();

    await inventoryPage.getItemImage('Sauce Labs Backpack').click();

    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const detailsPage = new ProductDetailsPage(page);
    await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    await expect(detailsPage.itemPrice).toHaveText(expectedPrice ?? '');
  });

  // Checks that clicking a product's name takes you to that product's own
  // details page, showing the matching name and price.
  test('clicking a product name opens its details page with matching name and price', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const expectedPrice = await inventoryPage.getItemPrice('Sauce Labs Backpack').textContent();

    await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const detailsPage = new ProductDetailsPage(page);
    await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    await expect(detailsPage.itemPrice).toHaveText(expectedPrice ?? '');
  });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });

  // Bug check: for the "problem_user" test account, clicking on "Sauce Labs
  // Backpack" navigates to the wrong product's details page ("Sauce Labs
  // Fleece Jacket" instead). Marked test.fail() so this documents the known
  // bug without turning the suite red; it will flag loudly if the bug is
  // ever fixed and this assertion starts passing for real.
  test.fail(
    'problem_user: clicking Sauce Labs Backpack opens the wrong product details page',
    async ({ page }) => {
      await page.goto('/inventory.html');

      const inventoryPage = new InventoryPage(page);
      await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

      await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

      const detailsPage = new ProductDetailsPage(page);
      await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    }
  );

  // Bug check: same BUG-004 as above, reached through the product image instead of the
  // name (found by the persona-explorer agent). Clicking the Backpack's image also opens
  // the Fleece Jacket's details page. Marked test.fail() for the same reason.
  test.fail(
    'problem_user: clicking the Sauce Labs Backpack image opens the wrong product details page',
    async ({ page }) => {
      await page.goto('/inventory.html');

      const inventoryPage = new InventoryPage(page);
      await inventoryPage.getItemImage('Sauce Labs Backpack').click();

      await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

      const detailsPage = new ProductDetailsPage(page);
      await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
    }
  );
});
