import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('standard_user', () => {
  test.use({ storageState: '.auth/standard_user.json' });

  // Bug check: the product sort <select> has no accessible name (no
  // <label>, aria-label, aria-labelledby, or title) — a real, critical-
  // impact WCAG 2.0 A violation (axe rule "select-name"), reproducible on
  // Chromium/Firefox/WebKit. Marked test.fail() so this documents the
  // known bug without turning the suite red; see BUG-009. It will flag
  // loudly if the site markup is ever fixed and this assertion starts
  // passing for real.
  test.fail('inventory page has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
    await page.goto('/inventory.html');

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(results.violations).toEqual([]);
  });
});
