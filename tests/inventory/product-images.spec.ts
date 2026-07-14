import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Checks that a normal user sees a different picture for every product (no duplicates).
  test('standard_user sees a distinct image for each product', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const srcs = await inventoryPage.getItemImageSources();

    expect(new Set(srcs).size).toBe(srcs.length);
  });
});

test.describe('problem_user', () => {
  test.use({ storageState: '.auth/problem_user.json' });

  // Bug check: for the "problem_user" test account, every product shows the
  // exact same (broken) picture instead of its own image.
  test('problem_user is served the same broken image for every product', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    const srcs = await inventoryPage.getItemImageSources();

    expect(new Set(srcs).size).toBe(1);
  });
});
