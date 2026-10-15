import { test, expect } from '../../fixtures';
import { attachWcagCoverage } from '../../utils/wcagCoverage';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Scans the cart page with an item actually in it, rather than the
  // empty-cart skeleton, so the scan reflects a realistic state.
  test('cart page has no WCAG 2.0 A/AA violations', async ({ page, inventoryPage, makeAxeBuilder }, testInfo) => {
    await page.goto('/inventory.html');

    await inventoryPage.getAddToCartButton('Sauce Labs Backpack').click();
    await inventoryPage.cartIcon.click();
    await expect(page).toHaveURL(/.*cart\.html/);

    const results = await test.step('axe scan: WCAG 2.0 A/AA', () =>
      makeAxeBuilder().analyze()
    );
    await attachWcagCoverage(testInfo, results);

    expect(results.violations).toEqual([]);
  });
});

