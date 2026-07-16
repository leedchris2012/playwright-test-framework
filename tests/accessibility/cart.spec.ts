import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Scans the cart page with an item actually in it, rather than the
  // empty-cart skeleton, so the scan reflects a realistic state.
  test('cart page has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await inventoryPage.cartIcon.click();
    await expect(page).toHaveURL(/.*cart\.html/);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
