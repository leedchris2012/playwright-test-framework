import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { LoginPage } from '../../pages/LoginPage';

// Scans the login page, unauthenticated, against the WCAG 2.0/2.1 A/AA
// rule set — this is the one page every user hits before any storage
// state applies.
test('login page has no WCAG 2.0/2.1 A/AA violations', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations).toEqual([]);
});
