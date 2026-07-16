import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Delays a single product image response by 3s rather than failing it
  // outright, and checks two distinct things: (1) the rest of the page —
  // name, price — isn't blocked waiting on that one slow image, and (2)
  // the image itself eventually loads correctly once the delayed response
  // completes, rather than erroring out. waitForResponse() makes the test
  // actually depend on the delay elapsing, rather than passing regardless
  // of whether the route handler ever resolves.
  test('inventory page renders correctly despite a slow image response', async ({ page }) => {
    await page.route('**/sauce-backpack-*.jpg', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await route.continue();
    });

    const imageResponse = page.waitForResponse('**/sauce-backpack-*.jpg');
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await expect(inventoryPage.getItemNameLink('Sauce Labs Backpack')).toBeVisible();
    await expect(inventoryPage.getItemPrice('Sauce Labs Backpack')).toHaveText('$29.99');

    const response = await imageResponse;
    expect(response.ok()).toBe(true);

    const image = inventoryPage.getItemImage('Sauce Labs Backpack');
    await expect(image).toBeVisible();
    await expect
      .poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0))
      .toBe(true);
  });
});
