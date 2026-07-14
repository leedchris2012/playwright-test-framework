import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';

test('standard_user sees a distinct image for each product', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  const srcs = await inventoryPage.getItemImageSources();

  expect(new Set(srcs).size).toBe(srcs.length);
});

test('problem_user is served the same broken image for every product', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('problem_user', 'secret_sauce');

  const inventoryPage = new InventoryPage(page);
  const srcs = await inventoryPage.getItemImageSources();

  expect(new Set(srcs).size).toBe(1);
});
