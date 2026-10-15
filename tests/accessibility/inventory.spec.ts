import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Regression guard for BUG-009 (sort <select> had no accessible name; fixed
  // upstream, verified 2026-10-15). axe rule "select-name" flags it if it returns.
  test('inventory page has no WCAG 2.0 A/AA violations', async ({ page }) => {
    await page.goto('/inventory.html');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
