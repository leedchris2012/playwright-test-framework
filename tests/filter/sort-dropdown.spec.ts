import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

// Checks that the "Name (A to Z)" sort option puts products in alphabetical order.
test('sorting by Name (A to Z) reorders items', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.sortBy('az');

  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Backpack');
  await expect(inventoryPage.lastItemName).toHaveText('Test.allTheThings() T-Shirt (Red)');
});

// Checks that the "Name (Z to A)" sort option puts products in reverse alphabetical order.
test('sorting by Name (Z to A) reorders items', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.sortBy('za');

  await expect(inventoryPage.firstItemName).toHaveText('Test.allTheThings() T-Shirt (Red)');
  await expect(inventoryPage.lastItemName).toHaveText('Sauce Labs Backpack');
});

// Checks that the "Price (low to high)" sort option puts the cheapest product first.
test('sorting by Price (low to high) reorders items', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await inventoryPage.sortBy('lohi');

  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Onesie');
  await expect(inventoryPage.lastItemName).toHaveText('Sauce Labs Fleece Jacket');
});

// Checks that the "Price (high to low)" sort option puts the most expensive product first.
test('sorting by Price (high to low) reorders items', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Backpack');

  await inventoryPage.sortBy('hilo');

  await expect(inventoryPage.firstItemName).toHaveText('Sauce Labs Fleece Jacket');
});

// Bug check: for the "problem_user" test account, sorting is broken and
// doesn't change the product order at all. This test confirms that known bug.
test('problem_user: sorting has no effect on item order', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('problem_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  const beforeSort = await inventoryPage.getItemNames();

  await inventoryPage.sortBy('za');

  const afterSort = await inventoryPage.getItemNames();
  expect(afterSort).toEqual(beforeSort);
});
