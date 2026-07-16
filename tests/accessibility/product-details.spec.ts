import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { InventoryPage } from '../../pages/InventoryPage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  test('product details page has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
    await page.goto('/inventory.html');

    const inventoryPage = new InventoryPage(page);
    await inventoryPage.getItemNameLink('Sauce Labs Backpack').click();
    await expect(page).toHaveURL(/.*inventory-item\.html\?id=\d+/);

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
