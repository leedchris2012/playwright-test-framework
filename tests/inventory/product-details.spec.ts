import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { ProductDetailsPage } from '../../pages/ProductDetailsPage';

// Checks that clicking a product's image takes you to that product's own
// details page, showing the matching name and price.
test('clicking a product image opens its details page with matching name and price', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

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
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  const expectedPrice = await inventoryPage.getItemPrice('Sauce Labs Backpack').textContent();

  await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

  await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

  const detailsPage = new ProductDetailsPage(page);
  await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
  await expect(detailsPage.itemPrice).toHaveText(expectedPrice ?? '');
});

// Bug check: for the "problem_user" test account, clicking on "Sauce Labs
// Backpack" navigates to the wrong product's details page ("Sauce Labs
// Fleece Jacket" instead). Marked test.fail() so this documents the known
// bug without turning the suite red; it will flag loudly if the bug is
// ever fixed and this assertion starts passing for real.
test.fail(
  'problem_user: clicking Sauce Labs Backpack opens the wrong product details page',
  async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('problem_user', 'secret_sauce');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();

    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const detailsPage = new ProductDetailsPage(page);
    await expect(detailsPage.itemName).toHaveText('Sauce Labs Backpack');
  }
);
