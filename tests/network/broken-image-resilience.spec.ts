import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Simulates a CDN/asset failure for a single product image (distinct
  // from problem_user's baked-in broken-image bug — this is a network-
  // layer failure, not an app bug) and confirms the page stays usable:
  // the item is still identifiable and addable to cart despite the
  // failed image request.
  test('inventory page remains usable when a product image request fails', async ({ page }) => {
    await page.route('**/sauce-backpack-*.jpg', (route) => route.abort('failed'));
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.getItemNameLink('Sauce Labs Backpack')).toBeVisible();

    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await expect(inventoryPage.cartBadge).toHaveText('1');
  });
});
